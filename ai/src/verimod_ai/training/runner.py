"""Frozen baseline execution; smoke results have an isolated SMOKE_ONLY namespace."""
from collections import Counter
from datetime import datetime, timezone
import hashlib
from importlib import metadata
import json
import math
from pathlib import Path, PureWindowsPath
import statistics
import subprocess
import threading
import time

import psutil
import torch
from transformers import (AutoConfig, AutoModelForSequenceClassification, AutoTokenizer,
                          DataCollatorWithPadding, Trainer, TrainerCallback, TrainingArguments)

from verimod_ai.data.preprocessing import MAX_CODE_POINTS, PREPROCESSING_VERSION
from verimod_ai.data.taxonomy import NATIVE_TARGET, PRIMARY_DATASET, REFERENCE_CLASS, SCORE_KEYS
from verimod_ai.training.dataset import (install_data_read_guard, label_maps, load_split,
                                         smoke_subset, tokenize_rows)
from verimod_ai.training.metrics import prediction_report, score_array, trainer_metrics
from verimod_ai.training.reproducibility import seed_runtime

REPO_ROOT = Path(__file__).resolve().parents[4]


def relative_path(root, value):
    if Path(value).is_absolute() or PureWindowsPath(value).is_absolute():
        raise ValueError('Source/config paths must be repository-relative')
    path = (root / value).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('Path escapes repository')
    return path


def validate_config(c):
    _, label2id = label_maps()
    if (tuple(c['native_labels']) != NATIVE_TARGET or c['label2id'] != label2id
            or tuple(c['exposed_score_keys']) != SCORE_KEYS or c['reference_class'] != REFERENCE_CLASS
            or c['primary_dataset'] != PRIMARY_DATASET):
        raise ValueError('Canonical native mapping mismatch')
    if (c['preprocessing_version'] != PREPROCESSING_VERSION or c['max_code_points'] != MAX_CODE_POINTS
            or c['loss'] != 'cross_entropy' or c['class_weighting'] is not None
            or c['selection_split'] != 'validation' or c['selection_metric'] != 'macro_f1'
            or c['checkpoint_selection_metric'] != c['selection_metric']
            or c['score_semantics'] != 'UNCALIBRATED' or c['test_access'] != 'SEALED'
            or c['trust_remote_code'] is not False):
        raise ValueError('Frozen training/score/seal contract mismatch')
    if c['split_files'] != {'train':'train.jsonl','validation':'validation.jsonl'}:
        raise ValueError('Split filenames must be the explicit allowlist')
    if c['effective_train_batch_size'] != c['train_batch_size'] * c['gradient_accumulation_steps']:
        raise ValueError('Effective batch mismatch')
    if c['device'] != 'cpu' or c['mixed_precision'] != 'none':
        raise ValueError('This frozen environment was verified only on CPU')
    for field in ('model_revision','tokenizer_revision'):
        if len(c[field]) != 40 or any(ch not in '0123456789abcdef' for ch in c[field]):
            raise ValueError('Immutable revision required')


def load_config(path, root=REPO_ROOT):
    raw = Path(path).read_bytes()
    approved = json.loads((root/'ai/artifacts/reports/w3_baseline/verification.json').read_text(encoding='utf-8'))
    if hashlib.sha256(raw).hexdigest() != approved['sha256']['ai/configs/w3_baseline.json']:
        raise ValueError('Config differs from approved baseline spec')
    c = json.loads(raw)
    validate_config(c)
    env = json.loads((root/'ai/artifacts/reports/w3_baseline/environment.json').read_text(encoding='utf-8'))
    for name, version in env['runtime_dependency_closure'].items():
        if metadata.version(name) != version:
            raise RuntimeError(f'Frozen dependency mismatch: {name}')
    return c


def artifact_locations(c, smoke, root=REPO_ROOT, stamp=None):
    if smoke:
        stamp = stamp or datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        base = root/'ai/artifacts/smoke/w3_runner'/stamp
        return base/'checkpoints', base/'results', 'SMOKE_ONLY'
    artifact = relative_path(root,c['artifact_path'])
    result = relative_path(root,c['result_path'])
    if not artifact.is_relative_to(root/'ai/artifacts/checkpoints'):
        raise ValueError('Model artifacts must stay in ignored checkpoints')
    if not result.is_relative_to(root/'ai/artifacts/reports'):
        raise ValueError('Results must stay in reports')
    return artifact, result, 'BASELINE'


def training_arguments(c, output, smoke=False):
    kwargs = dict(
        output_dir=str(output), run_name=c['run_name'] + ('-SMOKE_ONLY' if smoke else ''),
        use_cpu=c['device']=='cpu', fp16=False, bf16=False,
        num_train_epochs=c['epochs'], learning_rate=c['learning_rate'], weight_decay=c['weight_decay'],
        warmup_ratio=c['warmup_ratio'], lr_scheduler_type=c['lr_scheduler'], max_grad_norm=c['max_grad_norm'],
        optim=c['optimizer'], seed=c['seed'], data_seed=c['data_seed'],
        per_device_train_batch_size=c['train_batch_size'], per_device_eval_batch_size=c['eval_batch_size'],
        gradient_accumulation_steps=c['gradient_accumulation_steps'],
        dataloader_num_workers=c['dataloader_num_workers'], dataloader_pin_memory=c['dataloader_pin_memory'],
        full_determinism=c['full_determinism'], gradient_checkpointing=c['gradient_checkpointing'],
        eval_strategy=c['eval_strategy'], save_strategy=c['save_strategy'],
        load_best_model_at_end=c['load_best_model_at_end'], metric_for_best_model=c['checkpoint_selection_metric'],
        greater_is_better=c['greater_is_better'], save_total_limit=c['save_total_limit'],
        report_to=[], push_to_hub=False, save_safetensors=True, logging_nan_inf_filter=False,
        disable_tqdm=True, logging_steps=1 if smoke else 50,
    )
    if smoke:
        # Runtime overrides only, never mutate the official config or its epoch meaning.
        kwargs.update(max_steps=2, eval_strategy='steps', eval_steps=1,
                      save_strategy='steps', save_steps=1, save_only_model=True)
    return TrainingArguments(**kwargs)


def configure_model(model_config, scope):
    model_config.id2label, model_config.label2id = label_maps()
    model_config.problem_type = 'single_label_classification'
    model_config.verimod_artifact_scope = scope
    return model_config


class StepObserver(TrainerCallback):
    def __init__(self):
        self.seconds = []
        self.optimizer_steps = 0

    def on_step_begin(self, args, state, control, **kwargs):
        self.started = time.perf_counter()

    def on_optimizer_step(self, args, state, control, **kwargs):
        self.optimizer_steps += 1

    def on_step_end(self, args, state, control, **kwargs):
        self.seconds.append(time.perf_counter() - self.started)


class CheckedTrainer(Trainer):
    def __init__(self, *args, **kwargs):
        self.save_seconds = []
        self.epoch_loss_sum = 0.0
        self.epoch_examples = 0
        super().__init__(*args, **kwargs)

    def compute_loss(self, *args, **kwargs):
        model, inputs = args[:2]
        labels = inputs.get('labels')
        return_outputs = kwargs.pop('return_outputs',False)
        loss, outputs = super().compute_loss(*args,return_outputs=True,**kwargs)
        if not torch.isfinite(loss).all():
            raise FloatingPointError('Non-finite loss; BLOCKED')
        if model.training:
            # Observation only: never replace/rescale the loss used for backward.
            self.epoch_loss_sum += torch.nn.functional.cross_entropy(
                outputs.logits.detach(),labels,reduction='sum').item()
            self.epoch_examples += len(labels)
        return (loss,outputs) if return_outputs else loss

    def _save_checkpoint(self, *args, **kwargs):
        started = time.perf_counter()
        result = super()._save_checkpoint(*args, **kwargs)
        self.save_seconds.append(time.perf_counter() - started)
        return result


class MemoryMonitor:
    def __enter__(self):
        self.process = psutil.Process()
        self.peak = 0
        self.stop = threading.Event()
        def sample():
            while not self.stop.wait(0.1):
                info = self.process.memory_info()
                self.peak = max(self.peak, info.rss, getattr(info,'peak_wset',0))
        self.thread = threading.Thread(target=sample,daemon=True)
        self.thread.start()
        return self

    def __exit__(self, *args):
        self.stop.set()
        self.thread.join()
        info = self.process.memory_info()
        self.peak = max(self.peak,info.rss,getattr(info,'peak_wset',0))


class EpochObserver(TrainerCallback):
    """Official-run observability only; no optimizer/selection setting changes."""
    def __init__(self, trainer, directory, run_id):
        self.trainer,self.directory,self.run_id = trainer,directory,run_id
        self.epochs = []

    def on_train_begin(self,args,state,control,**kwargs):
        self.started = time.perf_counter()
        identity = json.loads((self.directory/'run_identity.json').read_text(encoding='utf-8'))
        identity.update(status='RUNNING',actual_training_started=True,
                        training_started_at_utc=datetime.now(timezone.utc).isoformat())
        write_json(self.directory/'run_identity.json',identity)

    def on_epoch_begin(self,args,state,control,**kwargs):
        self.epoch_started = time.perf_counter()
        self.trainer.epoch_loss_sum,self.trainer.epoch_examples = 0.0,0

    def on_step_end(self,args,state,control,**kwargs):
        if state.global_step % 10 == 0:
            write_json(self.directory/'progress.json',{
                'run_id':self.run_id,'step':state.global_step,'max_steps':state.max_steps,
                'epoch':state.epoch,'elapsed_seconds':time.perf_counter()-self.started,
                'process_rss_bytes':psutil.Process().memory_info().rss,
                'learning_rate':self.trainer.optimizer.param_groups[0]['lr'],
                'train_loss_epoch_so_far':self.trainer.epoch_loss_sum/self.trainer.epoch_examples})

    def on_evaluate(self,args,state,control,metrics,**kwargs):
        row = {'epoch':state.epoch,'step':state.global_step,
               'train_loss':self.trainer.epoch_loss_sum/self.trainer.epoch_examples,
               'train_examples':self.trainer.epoch_examples,'val_loss':metrics['eval_loss'],
               'macro_f1':metrics['eval_macro_f1'],'micro_f1':metrics['eval_micro_f1'],
               'accuracy':metrics['eval_accuracy'],
               'learning_rate':self.trainer.optimizer.param_groups[0]['lr'],
               'epoch_seconds_including_validation':time.perf_counter()-self.epoch_started,
               'elapsed_seconds':time.perf_counter()-self.started,
               'process_rss_bytes':psutil.Process().memory_info().rss}
        self.epochs.append(row)
        write_json(self.directory/'epoch_log.json',{'run_id':self.run_id,'epochs':self.epochs,
                    'train_loss_definition':'sample-weighted unscaled forward cross entropy; observation only'})
        print('EPOCH_RESULT '+json.dumps(row),flush=True)


def full_estimate(c, train_n, validation_n, step_seconds, eval_seconds, eval_n,
                  load_seconds, token_seconds, token_n, save_seconds):
    micro = math.ceil(train_n/c['train_batch_size'])
    updates = math.ceil(micro/c['gradient_accumulation_steps'])
    total_updates = math.ceil(c['epochs']*updates)
    # Epoch selection evaluation plus one final selected-model prediction export.
    validation_passes = math.ceil(c['epochs']) + 1
    save_events = math.ceil(c['epochs']) + 1
    estimated = (total_updates*statistics.mean(step_seconds)
                 + validation_passes*validation_n/eval_n*eval_seconds
                 + load_seconds + token_seconds*(train_n+validation_n)/token_n
                 + save_events*statistics.mean(save_seconds))
    hours = estimated/3600
    scheduling = ('FEASIBLE_LOCAL_CPU' if hours <= 8 else
                  'MARGINAL_LOCAL_CPU' if hours <= 16 else 'NOT_RECOMMENDED_LOCAL_CPU')
    return {'kind':'ESTIMATE','train_n':train_n,'validation_n':validation_n,'epochs':c['epochs'],
            'micro_batch':c['train_batch_size'],'gradient_accumulation':c['gradient_accumulation_steps'],
            'micro_batches_per_epoch':micro,'micro_batches_total':micro*math.ceil(c['epochs']),
            'optimizer_updates_per_epoch':updates,'optimizer_updates_total':total_updates,
            'validation_passes_including_final_export':validation_passes,
            'model_save_events_including_final_export':save_events,
            'seconds':estimated,'hours':hours,'scheduling_class':scheduling,
            'method':'mean observed optimizer-update compute duration + epoch validation and final prediction export + load/tokenization/checkpoint overhead',
            'limitations':['2 updates only','dynamic padding subset shapes','cold-start/thermal/load variation',
                           'smoke saves model only; full checkpoint optimizer I/O is unmeasured',
                           'process startup/library imports not included',
                           'not a measured full-training runtime']}


def write_json(path, value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')


def run(config_path, directory, *, smoke=False, offline=False, root=REPO_ROOT,run_id=None):
    start = time.perf_counter()
    c = load_config(config_path,root)
    artifact, result_dir, scope = artifact_locations(c,smoke,root)
    if artifact.exists() or result_dir.exists():
        raise FileExistsError('Refuse to overwrite an existing run')
    if torch.cuda.is_available():
        raise RuntimeError('Runtime differs from the frozen CPU environment')
    guard = install_data_read_guard(directory)
    controls = seed_runtime(c)
    dataset_config = json.loads(relative_path(root,c['dataset_config']).read_text(encoding='utf-8'))
    data_start = time.perf_counter()
    rows = {s:load_split(directory,s,training=(s=='train'),baseline=c,dataset_config=dataset_config)
            for s in ('train','validation')}
    full_counts = {s:len(r) for s,r in rows.items()}
    if smoke:
        rows = {s:smoke_subset(r,c['seed']) for s,r in rows.items()}
    data_seconds = time.perf_counter()-data_start
    kw = dict(revision=c['tokenizer_revision'],trust_remote_code=c['trust_remote_code'],
              cache_dir=relative_path(root,c['source_cache_path']),local_files_only=offline,token=False)
    token_start = time.perf_counter()
    tokenizer = AutoTokenizer.from_pretrained(c['tokenizer_id'],use_fast=c['use_fast_tokenizer'],**kw)
    datasets = {s:tokenize_rows(r,tokenizer,c) for s,r in rows.items()}
    token_seconds = time.perf_counter()-token_start
    model_start = time.perf_counter()
    kw['revision'] = c['model_revision']
    from huggingface_hub import hf_hub_download
    source = json.loads((root/'ai/artifacts/reports/w3_baseline/model_source.json').read_text(encoding='utf-8'))
    weight = hf_hub_download(c['model_id'],'model.safetensors',revision=c['model_revision'],
                             cache_dir=kw['cache_dir'],local_files_only=offline,token=False)
    digest = hashlib.sha256()
    with open(weight,'rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):
            digest.update(chunk)
    if digest.hexdigest() != source['pretrained_weight_sha256']:
        raise RuntimeError('Pretrained weight differs from approved source evidence')
    model_config = AutoConfig.from_pretrained(c['model_id'],**kw)
    if model_config._commit_hash != c['model_revision']:
        raise RuntimeError('Pinned config revision mismatch')
    configure_model(model_config,scope)
    model, loading = AutoModelForSequenceClassification.from_pretrained(
        c['model_id'],config=model_config,use_safetensors=True,output_loading_info=True,**kw)
    if loading['error_msgs'] or loading['mismatched_keys']:
        raise RuntimeError('Pinned model checkpoint mismatch')
    model_seconds = time.perf_counter()-model_start
    counts = {'train_forwards':0,'eval_forwards':0,'backwards':0,'train_examples_seen':0}
    def forward_hook(module, args, kwargs):
        counts['train_forwards' if module.training else 'eval_forwards'] += 1
        if module.training:
            counts['train_examples_seen'] += kwargs['input_ids'].shape[0]
    def backward_hook(gradient):
        if not torch.isfinite(gradient).all():
            raise FloatingPointError('Non-finite backward gradient; BLOCKED')
        counts['backwards'] += 1
        return gradient
    model.register_forward_pre_hook(forward_hook,with_kwargs=True)
    model.classifier.out_proj.weight.register_hook(backward_hook)
    observer = StepObserver()
    trainer = CheckedTrainer(model=model,args=training_arguments(c,artifact,smoke),
                             train_dataset=datasets['train'],eval_dataset=datasets['validation'],
                             data_collator=DataCollatorWithPadding(tokenizer,padding=True),
                             processing_class=tokenizer,compute_metrics=trainer_metrics,callbacks=[observer])
    if run_id:
        meta_dir = root/'ai/artifacts/reports/w3_baseline_run'/run_id
        trainer.add_callback(EpochObserver(trainer,meta_dir,run_id))
    print(f'{scope}: TRAIN={len(datasets["train"])} VALIDATION={len(datasets["validation"])}',flush=True)
    train_start = time.perf_counter()
    train_result = trainer.train()
    train_seconds = time.perf_counter()-train_start
    if smoke and (trainer.state.global_step != 2 or counts['train_examples_seen'] > 32):
        raise RuntimeError('Smoke execution exceeded boundary')
    if not math.isfinite(train_result.training_loss):
        raise FloatingPointError('Non-finite training loss')
    if not trainer.state.best_model_checkpoint or trainer.state.best_metric is None:
        raise RuntimeError('Validation Macro-F1 checkpoint selection did not execute')
    if not smoke:
        # Explicit checkpoint reload immediately before the single final prediction pass.
        trainer._load_best_model()
        trainer.save_state()
    eval_start = time.perf_counter()
    prediction = trainer.predict(datasets['validation'],metric_key_prefix='eval')
    eval_seconds = time.perf_counter()-eval_start
    if 'eval_macro_f1' not in prediction.metrics:
        raise RuntimeError('Missing required selection metric')
    report = prediction_report(prediction.predictions,prediction.label_ids)
    final = artifact/'selected_model'
    trainer.save_model(str(final))
    saved = AutoConfig.from_pretrained(final,trust_remote_code=False,local_files_only=True)
    if (saved.id2label,saved.label2id) != label_maps():
        raise RuntimeError('Saved model label mapping changed')
    if saved.verimod_artifact_scope != scope:
        raise RuntimeError('Saved model artifact scope changed')
    result_dir.mkdir(parents=True)
    write_json(result_dir/'validation_metrics.json',{'scope':scope,'not_model_performance_results':smoke,'metrics':report})
    if not smoke:
        scores = score_array(prediction.predictions)
        prediction_dir = root/'ai/artifacts/results'/(run_id or c['run_name'])
        prediction_dir.mkdir(parents=True,exist_ok=True)
        with (prediction_dir/'validation_predictions.jsonl').open('w',encoding='utf-8') as stream:
            for index,(logits,score,label) in enumerate(zip(prediction.predictions,scores,prediction.label_ids)):
                predicted = int(score.argmax())
                stream.write(json.dumps({'example_id':f'validation:{index:06d}','index':index,
                    'y_true':NATIVE_TARGET[label],'y_pred':NATIVE_TARGET[predicted],
                    **{f'score_{name}':float(score[i]) for i,name in enumerate(NATIVE_TARGET)},
                    'is_correct':bool(label==predicted),'logits':logits.tolist(),
                    'model_scores':dict(zip(NATIVE_TARGET,map(float,score))),
                    'score_semantics':c['score_semantics']})+'\n')
    throughput = {'model_load_seconds':model_seconds,'dataset_load_seconds':data_seconds,
                  'preprocessing_tokenization_seconds':token_seconds,'train_wall_seconds':train_seconds,
                  'optimizer_steps':observer.optimizer_steps,'optimizer_step_seconds':observer.seconds,
                  'optimizer_step_mean_seconds':statistics.mean(observer.seconds),
                  'optimizer_step_p50_seconds':statistics.median(observer.seconds),
                  'train_examples_per_second':counts['train_examples_seen']/train_seconds,
                  'train_steps_per_second':observer.optimizer_steps/train_seconds,
                  'train_compute_seconds':sum(observer.seconds),
                  'validation_seconds':eval_seconds,
                  'validation_examples_per_second':len(datasets['validation'])/eval_seconds,
                  'checkpoint_save_seconds':trainer.save_seconds}
    estimate = full_estimate(c,full_counts['train'],full_counts['validation'],observer.seconds,
                            eval_seconds,len(datasets['validation']),model_seconds,token_seconds,
                            sum(len(d) for d in datasets.values()),trainer.save_seconds) if smoke else None
    summary = {'scope':scope,'official_baseline_executed':not smoke,
               'run_id':run_id,'parameter_count':sum(p.numel() for p in model.parameters()),
               'best_checkpoint_path':str(Path(trainer.state.best_model_checkpoint).relative_to(root)).replace('\\','/'),
               'best_metric':trainer.state.best_metric,'global_step':trainer.state.global_step,
               'final_prediction_count':len(prediction.label_ids),
               'executed_at_utc':datetime.now(timezone.utc).isoformat(),
               'branch':subprocess.check_output(['git','branch','--show-current'],cwd=root,text=True).strip(),
               'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),
               'dirty':bool(subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip()),
               'model_id':c['model_id'],'model_revision':c['model_revision'],
               'tokenizer_revision':c['tokenizer_revision'],'label2id':c['label2id'],
               'device':str(trainer.args.device),'torch':torch.__version__,'transformers':metadata.version('transformers'),
               'seed_controls':controls,'split_counts':{s:len(r) for s,r in rows.items()},
               'subset_class_counts':{s:dict(Counter(r['label'] for r in records)) for s,records in rows.items()},
               'data_read_guard':guard,'test_accessed':False,'execution_counts':counts,
               'scheduler_last_epoch':trainer.lr_scheduler.last_epoch,
               'eval_macro_f1_present':True,'best_checkpoint_selected':True,'saved_label_mapping_verified':True,
               'metric_boundary':'SMOKE METRICS ARE NOT MODEL PERFORMANCE RESULTS.' if smoke else 'VALIDATION ONLY',
               'smoke_overrides':{'max_steps':2,'eval_save_strategy':'steps','eval_save_steps':1,'save_only_model':True} if smoke else {},
               'artifact_path':str(artifact.relative_to(root)).replace('\\','/'),
               'result_path':str(result_dir.relative_to(root)).replace('\\','/'),
               'throughput':throughput,'full_baseline_estimate':estimate,'elapsed_seconds':time.perf_counter()-start}
    write_json(result_dir/'run_summary.json',summary)
    return summary, result_dir
