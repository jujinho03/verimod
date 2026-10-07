"""Synthetic fixtures/config only; never open/stat/hash actual sealed TEST."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import numpy as np
import torch
from transformers import AutoConfig, RobertaConfig, Trainer
from verimod_ai.data.taxonomy import NATIVE_TARGET
from verimod_ai.training.dataset import (label_maps, load_split, smoke_subset, split_path, tokenize_rows)
from verimod_ai.training.metrics import prediction_report, score_array, trainer_metrics
from verimod_ai.training.runner import (REPO_ROOT, CheckedTrainer, EpochObserver, artifact_locations, configure_model, full_estimate,
                                        load_config, training_arguments, validate_config)

CONFIG = REPO_ROOT/'ai/configs/w3_baseline.json'


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads(CONFIG.read_text(encoding='utf-8'))

    def test_approved_config_load_and_canonical_mapping(self):
        self.assertEqual(load_config(CONFIG),self.config)
        id2label,label2id = label_maps()
        self.assertEqual(tuple(id2label.values()),NATIVE_TARGET)
        self.assertEqual(label2id,self.config['label2id'])

    def test_mapping_mismatch_rejected(self):
        c = deepcopy(self.config)
        c['label2id'] = {'hate':1,'offensive':0,'none':2}
        with self.assertRaises(ValueError):
            validate_config(c)

    def test_test_aliases_reject_before_any_filesystem_operation(self):
        with patch.object(Path,'resolve',side_effect=AssertionError('no path access')):
            for split in ('test','TEST','sealed','dev','../test','test.jsonl','validation/../test',''):
                with self.subTest(split=split),self.assertRaises(PermissionError):
                    split_path('no-real-directory',split,training=False)

    def test_split_purpose_cannot_be_reversed(self):
        for split,training in [('validation',True),('train',False)]:
            with self.assertRaises(PermissionError):
                split_path('no-real-directory',split,training=training)

    def test_synthetic_train_and_validation_load_and_hash_guard(self):
        # No TEST fixture/path is created, statted, hashed, or opened.
        dc = json.loads((REPO_ROOT/self.config['dataset_config']).read_text(encoding='utf-8'))
        with tempfile.TemporaryDirectory() as directory:
            rows = [{'record_id':f'synthetic-{i}','text':f'synthetic item {i}',
                     'label':label} for i,label in enumerate(NATIVE_TARGET)]
            raw = ('\n'.join(json.dumps(r) for r in rows)+'\n').encode()
            c = deepcopy(self.config)
            for split in ('train','validation'):
                (Path(directory)/f'{split}.jsonl').write_bytes(raw)
                c['split_provenance'][split] = {'count':3,'class_counts':dict.fromkeys(NATIVE_TARGET,1),
                                               'sha256':hashlib.sha256(raw).hexdigest()}
                self.assertEqual(load_split(directory,split,training=(split=='train'),baseline=c,dataset_config=dc),rows)
            c['split_provenance']['train']['sha256'] = '0'*64
            with self.assertRaises(ValueError):
                load_split(directory,'train',training=True,baseline=c,dataset_config=dc)

    def test_subset_seed_limit_and_three_classes(self):
        rows = [{'label':NATIVE_TARGET[i%3],'record_id':str(i)} for i in range(90)]
        a = smoke_subset(rows,self.config['seed'])
        self.assertEqual(a,smoke_subset(rows,self.config['seed']))
        self.assertEqual(len(a),32)
        self.assertEqual({r['label'] for r in a},set(NATIVE_TARGET))
        self.assertEqual(len({r['record_id'] for r in a}),32)
        for limit in (2,33):
            with self.assertRaises(ValueError):
                smoke_subset(rows,self.config['seed'],limit)

    def test_existing_preprocessing_and_token_boundary(self):
        class Tokenizer:
            def __call__(self,texts,**kwargs):
                self.texts,self.options = texts,kwargs
                return {'input_ids':[[1]*min(len(t),kwargs['max_length']) for t in texts],
                        'attention_mask':[[1]*min(len(t),kwargs['max_length']) for t in texts]}
        tokenizer = Tokenizer()
        ds = tokenize_rows([{'record_id':'synthetic','text':'x'*501,'label':'hate'}],tokenizer,self.config)
        self.assertEqual(len(tokenizer.texts[0]),500)
        self.assertTrue(tokenizer.options['truncation'])
        self.assertFalse(tokenizer.options['padding'])
        self.assertEqual(len(ds[0]['input_ids']),128)
        self.assertEqual(ds[0]['labels'],self.config['label2id']['hate'])

    def test_official_training_arguments_map_without_mutating_config(self):
        c = deepcopy(self.config)
        args = training_arguments(c,'unused-output')
        for actual,key in [('num_train_epochs','epochs'),('learning_rate','learning_rate'),
                           ('weight_decay','weight_decay'),('warmup_ratio','warmup_ratio'),
                           ('max_grad_norm','max_grad_norm'),('seed','seed'),('data_seed','data_seed'),
                           ('per_device_train_batch_size','train_batch_size'),
                           ('per_device_eval_batch_size','eval_batch_size'),
                           ('gradient_accumulation_steps','gradient_accumulation_steps')]:
            self.assertEqual(getattr(args,actual),c[key])
        self.assertEqual(args.max_steps,-1)
        self.assertEqual(args.eval_strategy.value,'epoch')
        self.assertEqual(args.metric_for_best_model,'macro_f1')
        self.assertTrue(args.load_best_model_at_end)
        self.assertEqual(args.optim.value,'adamw_torch')
        self.assertFalse(args.fp16 or args.bf16)
        self.assertEqual(c,self.config)

    def test_smoke_arguments_and_artifacts_are_isolated(self):
        c = deepcopy(self.config)
        path,result,scope = artifact_locations(c,True,stamp='synthetic-unit-test')
        official,_,official_scope = artifact_locations(c,False)
        self.assertEqual(scope,'SMOKE_ONLY')
        self.assertEqual(official_scope,'BASELINE')
        self.assertNotEqual(path,official)
        self.assertIn('smoke',path.parts)
        self.assertIn('smoke',result.parts)
        args = training_arguments(c,path,True)
        self.assertEqual(args.max_steps,2)
        self.assertEqual(args.eval_strategy.value,'steps')
        self.assertTrue(args.save_only_model)
        self.assertEqual(c,self.config)

    def test_saved_model_config_retains_native_maps(self):
        with tempfile.TemporaryDirectory() as directory:
            config = configure_model(RobertaConfig(),'SMOKE_ONLY')
            self.assertEqual(config.num_labels,3)
            config.save_pretrained(directory)
            restored = AutoConfig.from_pretrained(directory,local_files_only=True,trust_remote_code=False)
            self.assertEqual((restored.id2label,restored.label2id),label_maps())
            self.assertEqual(restored.verimod_artifact_scope,'SMOKE_ONLY')

    def test_toy_metric_adapter_and_one_vs_rest(self):
        logits = np.array([[0,3,0],[0,3,0],[0,0,3]],dtype=float)
        ids = np.array([0,1,2])
        report = prediction_report(logits,ids)
        self.assertAlmostEqual(report['macro_f1'],(0+2/3+1)/3)
        self.assertAlmostEqual(report['accuracy'],2/3)
        self.assertEqual(report['one_vs_rest']['hate']['fnr'],1)
        self.assertEqual(report['one_vs_rest']['offensive']['fpr'],0.5)
        self.assertEqual(report['per_class']['none']['support'],1)
        self.assertEqual(trainer_metrics(SimpleNamespace(predictions=logits,label_ids=ids))['macro_f1'],report['macro_f1'])
        self.assertEqual(report['score_semantics'],'UNCALIBRATED')
        np.testing.assert_allclose(score_array(logits).sum(axis=1),1)
        no_negatives = prediction_report(np.array([[3.,0.,0.]]),np.array([0]))
        self.assertFalse(no_negatives['one_vs_rest']['hate']['fpr_defined'])
        self.assertFalse(no_negatives['one_vs_rest']['none']['fnr_defined'])

    def test_invalid_logits_and_label_ids_fail(self):
        for logits,ids in [(np.ones((3,5)),np.array([0,1,2])),
                           (np.array([[np.nan,0,0]]),np.array([0])),
                           (np.ones((1,3)),np.array([3]))]:
            with self.assertRaises(ValueError):
                prediction_report(logits,ids)

    def test_full_estimate_counts_and_scheduling_boundaries(self):
        for seconds,expected in [(1,'FEASIBLE_LOCAL_CPU'),(30,'MARGINAL_LOCAL_CPU'),
                                 (60,'NOT_RECOMMENDED_LOCAL_CPU')]:
            estimate = full_estimate(self.config,5857,1255,[seconds,seconds],0.01,32,0,0,64,[0])
            self.assertEqual(estimate['micro_batches_total'],4395)
            self.assertEqual(estimate['optimizer_updates_total'],1101)
            self.assertEqual(estimate['validation_passes_including_final_export'],4)
            self.assertEqual(estimate['model_save_events_including_final_export'],4)
            self.assertEqual(estimate['scheduling_class'],expected)
            self.assertEqual(estimate['kind'],'ESTIMATE')

    def test_epoch_loss_observation_never_changes_backward_loss(self):
        trainer = object.__new__(CheckedTrainer)
        trainer.epoch_loss_sum,trainer.epoch_examples = 0.0,0
        logits = torch.tensor([[2.,0.,0.],[0.,2.,0.]])
        labels = torch.tensor([0,1])
        original_loss = torch.tensor(0.123)
        outputs = SimpleNamespace(logits=logits)
        with patch.object(Trainer,'compute_loss',return_value=(original_loss,outputs)):
            result = trainer.compute_loss(SimpleNamespace(training=True),{'labels':labels})
            self.assertIs(result,original_loss)
            self.assertEqual(trainer.epoch_examples,2)
            self.assertAlmostEqual(trainer.epoch_loss_sum,
                torch.nn.functional.cross_entropy(logits,labels,reduction='sum').item())
            result = trainer.compute_loss(SimpleNamespace(training=False),{'labels':labels},return_outputs=True)
            self.assertEqual(result,(original_loss,outputs))
            self.assertEqual(trainer.epoch_examples,2)

    def test_official_epoch_observer_writes_only_synthetic_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            (base/'run_identity.json').write_text(json.dumps({'actual_training_started':False}),encoding='utf-8')
            trainer = SimpleNamespace(optimizer=SimpleNamespace(param_groups=[{'lr':2e-5}]))
            observer = EpochObserver(trainer,base,'synthetic-unit-test')
            state = SimpleNamespace(global_step=360,max_steps=1101,epoch=1.0)
            observer.on_train_begin(None,state,None)
            observer.on_epoch_begin(None,state,None)
            trainer.epoch_loss_sum,trainer.epoch_examples = 6.,3
            observer.on_step_end(None,state,None)
            observer.on_evaluate(None,state,None,{'eval_loss':1.,'eval_macro_f1':.5,
                                                 'eval_micro_f1':.6,'eval_accuracy':.6})
            row = json.loads((base/'epoch_log.json').read_text())['epochs'][0]
            self.assertEqual(row['train_loss'],2.)
            self.assertEqual(row['step'],360)
            self.assertTrue((base/'progress.json').is_file())


if __name__ == '__main__':
    unittest.main()
