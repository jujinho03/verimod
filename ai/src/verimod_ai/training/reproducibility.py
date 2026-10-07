"""Explicit controls, without claiming cross-platform bitwise reproducibility."""
import os
import random


def seed_runtime(config):
    import numpy as np
    import torch
    from transformers import set_seed
    seed = config['seed']
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    set_seed(seed)
    torch.set_num_threads(config['torch_num_threads'])
    torch.set_num_interop_threads(config['torch_num_interop_threads'])
    # Preserve the approved full_determinism=False; do not force unsupported ops.
    torch.use_deterministic_algorithms(config['full_determinism'])
    return {'seed': seed, 'data_seed': config['data_seed'],
            'controls': ['random', 'numpy', 'torch_cpu', 'Trainer.seed', 'Trainer.data_seed'],
            'cuda_seed_applied': torch.cuda.is_available(),
            'pythonhashseed': os.environ.get('PYTHONHASHSEED'),
            'deterministic_algorithms': torch.are_deterministic_algorithms_enabled(),
            'bitwise_reproducibility_claimed': False}
