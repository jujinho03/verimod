"""W6 AI-19: standalone offline inference probe for the existing R01 service.

Runs without any agent or external service. It never changes network settings,
never reads datasets, never trains, and only stops the server process it started.

  online-config     : HF offline flags only; network may be connected (not AI-19 PASS)
  physical-offline  : run after the user manually disconnects all external networks

Result JSON is always written, including on failure.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import importlib.metadata as md
import json
import os
from pathlib import Path
import platform
import re
import socket
import subprocess
import sys
import time
import traceback
import urllib.error
import urllib.request

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PY = ROOT / "ai/.venv/Scripts/python.exe"
SERVE = ROOT / "ai/scripts/serve_w4_inference.py"
MODEL_DIR = ROOT / "ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model"
CACHE = ROOT / "ai/.venv/hf-cache"
REVISION = "02f94ba5e3fcb7e2a58a390b8639b0fac974a8da"
SNAPSHOT = CACHE / "models--klue--roberta-base/snapshots" / REVISION
TOKENIZER_FILES = ("tokenizer.json", "tokenizer_config.json", "special_tokens_map.json", "vocab.txt")
EXPECTED = {
    "artifact_sha256": "a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f",
    "model_manifest_hash": "0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1",
    "run_id": "AI07-BL-KLUE-RB-45126-R01",
}
W4_PATHS = ["docs/handoffs/w4-anchored-epoch-public", "docs/handoffs/w4-frozen-epoch-public",
            "ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json",
            "ai/artifacts/reports/w4_a_validation", "ai/artifacts/reports/w4_a_revalidation",
            "backend/contracts/contracts"]
PROBE = {"text": "오늘은 날씨가 좋아서 친구와 함께 산책했어요.",
         "content_commitment": "0x" + "ab" * 32, "request_id": "w6_ai19_offline_probe"}
KST = timezone(timedelta(hours=9))


def now():
    t = datetime.now(timezone.utc)
    return {"utc": t.isoformat(timespec="seconds"), "kst": t.astimezone(KST).isoformat(timespec="seconds")}


def sha256(path: Path, normalize_crlf=False):
    data = path.read_bytes()
    if normalize_crlf:
        data = data.replace(b"\r\n", b"\n")
    return hashlib.sha256(data).hexdigest()


def run(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=ROOT,
                           encoding="utf-8", errors="replace")
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except Exception as exc:  # recorded, never fatal
        return None, "", f"{type(exc).__name__}: {exc}"


def git_state():
    head = run(["git", "rev-parse", "HEAD"])[1]
    branch = run(["git", "branch", "--show-current"])[1]
    dirty = run(["git", "status", "--short", "--untracked-files=no"])[1]
    w4_changed = run(["git", "diff", "--name-only", "ba8b7bc", "HEAD", "--", *W4_PATHS])[1]
    w4_worktree = run(["git", "status", "--short", "--", *W4_PATHS])[1]
    return {"branch": branch, "head": head, "tracked_changes": dirty.splitlines(),
            "w4_scope_changed_since_ba8b7bc": w4_changed.splitlines(),
            "w4_scope_worktree_changes": w4_worktree.splitlines()}


def environment():
    pkgs = {}
    for name in ("torch", "transformers", "tokenizers", "fastapi", "uvicorn", "starlette", "pydantic",
                 "safetensors", "numpy", "httpx", "huggingface-hub"):
        try:
            pkgs[name] = md.version(name)
        except md.PackageNotFoundError:
            pkgs[name] = None
    lock_check = {}
    for lock in ("ai/requirements-w4-service.lock.txt", "ai/requirements-w3.lock.txt"):
        path = ROOT / lock
        mismatches, pinned = [], 0
        for line in path.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^([A-Za-z0-9_.\-]+)==([^\s;#]+)", line.strip())
            if not m:
                continue
            pinned += 1
            try:
                got = md.version(m.group(1))
            except md.PackageNotFoundError:
                got = None
            if got is None or got.split("+")[0] != m.group(2).split("+")[0]:
                mismatches.append({"package": m.group(1), "pinned": m.group(2), "installed": got})
        lock_check[lock] = {"sha256": sha256(path, True), "pinned": pinned, "mismatches": mismatches}
    pip_check = run([str(PY), "-m", "pip", "check"], timeout=120)
    return {"os": platform.platform(), "machine": platform.machine(), "processor": platform.processor(),
            "python": sys.version, "venv": PY.relative_to(ROOT).as_posix(),
            "packages": pkgs, "lock_check": lock_check,
            "pip_check": {"returncode": pip_check[0], "output": pip_check[1][-500:]}}


def artifacts():
    sys.path.insert(0, str(ROOT / "ai/src"))
    from verimod_ai.inference import service  # constants only; no model load
    out = {"model_dir_exists": MODEL_DIR.is_dir(), "snapshot_exists": SNAPSHOT.is_dir()}
    weights = MODEL_DIR / "model.safetensors"
    out["weights"] = {"exists": weights.is_file(), "bytes": weights.stat().st_size if weights.is_file() else None,
                      "sha256": sha256(weights) if weights.is_file() else None,
                      "expected": EXPECTED["artifact_sha256"]}
    out["weights"]["match"] = out["weights"]["sha256"] == EXPECTED["artifact_sha256"]
    cfg = MODEL_DIR / "config.json"
    out["config"] = {"sha256_lf": sha256(cfg, True) if cfg.is_file() else None, "expected": service.CONFIG_FILE_SHA}
    out["config"]["match"] = out["config"]["sha256_lf"] == service.CONFIG_FILE_SHA
    out["manifest"] = {"path": service.MANIFEST.relative_to(ROOT).as_posix(),
                       "sha256_lf": sha256(service.MANIFEST, True), "expected": service.MANIFEST_FILE_SHA,
                       "pinned_manifest_hash": service.MANIFEST_HASH}
    out["manifest"]["match"] = out["manifest"]["sha256_lf"] == service.MANIFEST_FILE_SHA
    out["service_constants_match"] = (service.MANIFEST_HASH == EXPECTED["model_manifest_hash"]
                                      and service.ARTIFACT_SHA == EXPECTED["artifact_sha256"]
                                      and service.REVISION == REVISION)
    out["tokenizer_snapshot_files"] = {
        f: (sha256(SNAPSHOT / f) if (SNAPSHOT / f).exists() else None) for f in TOKENIZER_FILES}
    out["tokenizer_note"] = ("Collected for evidence only. The service pins tokenizer revision and "
                             "local_files_only=True but does not verify these file hashes; this is NOT the "
                             "W5 runtime binding implementation or a LOCK.")
    return out


def network_state():
    ps = ("[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;$ErrorActionPreference='SilentlyContinue';"
          "$a=Get-NetAdapter|Select-Object Name,InterfaceDescription,Status,MediaType,HardwareInterface;"
          "$p=Get-NetConnectionProfile|Select-Object InterfaceAlias,IPv4Connectivity,IPv6Connectivity,NetworkCategory;"
          "$r=Get-NetRoute -DestinationPrefix '0.0.0.0/0','::/0'|Select-Object InterfaceAlias,DestinationPrefix,NextHop,RouteMetric;"
          "@{adapters=@($a);profiles=@($p);default_routes=@($r)}|ConvertTo-Json -Depth 4 -Compress")
    code, out, err = run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps], timeout=60)
    try:
        info = json.loads(out) if out else {}
    except ValueError:
        info = {"raw": out[:2000]}
    info["query_error"] = err[:500] if code else None
    # Never record private gateway IPs: keep only whether a next hop exists.
    routes = info.get("default_routes") or []
    for r in (routes if isinstance(routes, list) else [routes]):
        if isinstance(r, dict) and "NextHop" in r:
            r["NextHop"] = "ON_LINK" if r["NextHop"] in ("0.0.0.0", "::") else "REDACTED_GATEWAY"

    def tcp(host, port):
        try:
            with socket.create_connection((host, port), timeout=3):
                return "CONNECTED"
        except OSError as exc:
            return f"FAILED:{type(exc).__name__}"

    def dns(host):
        try:
            return f"RESOLVED:{socket.getaddrinfo(host, 443)[0][4][0]}"
        except OSError as exc:
            return f"FAILED:{type(exc).__name__}"

    probes = {"dns_huggingface.co": dns("huggingface.co"), "dns_github.com": dns("github.com"),
              "tcp_1.1.1.1:443": tcp("1.1.1.1", 443), "tcp_8.8.8.8:53": tcp("8.8.8.8", 53),
              "tcp_huggingface.co:443": tcp("huggingface.co", 443)}
    info["external_probes"] = probes
    internet_profiles = [p for p in info.get("profiles") or []
                         if isinstance(p, dict) and (str(p.get("IPv4Connectivity")) in ("Internet", "4")
                                                     or str(p.get("IPv6Connectivity")) in ("Internet", "4"))]
    any_external = any(v.startswith(("CONNECTED", "RESOLVED")) for v in probes.values())

    def as_list(v):
        return v if isinstance(v, list) else ([v] if isinstance(v, dict) else [])

    adapters = as_list(info.get("adapters"))
    up = {a.get("Name"): a for a in adapters if str(a.get("Status")) == "Up"}
    # Physical uplinks (Wi-Fi/Ethernet/USB or Bluetooth tethering NICs) must not be Up.
    physical_up = sorted(n for n, a in up.items() if a.get("HardwareInterface") is True)
    # Any adapter (incl. VPN such as Tailscale exit node) holding a default route while Up.
    route_up = sorted({r.get("InterfaceAlias") for r in as_list(info.get("default_routes"))
                       if r.get("InterfaceAlias") in up})
    vpn_up = sorted(n for n, a in up.items()
                    if re.search(r"tailscale|vpn|wireguard|openvpn|tap-|tun", f"{n} {a.get('InterfaceDescription')}", re.I))
    virtual_up_no_route = sorted(n for n, a in up.items()
                                 if a.get("HardwareInterface") is not True and n not in route_up)
    checks = {
        "external_dns_tcp_all_failed": not any_external,
        "no_internet_connectivity_profile": not internet_profiles,
        "no_physical_adapter_up": not physical_up,
        "no_default_route_on_up_adapter": not route_up,
        "adapter_query_succeeded": bool(adapters),
    }
    if any_external:
        verdict = "ONLINE_EXTERNAL_REACHABLE"
    elif all(checks.values()):
        verdict = "PHYSICAL_OFFLINE_VERIFIED"
    else:
        verdict = "PHYSICAL_OFFLINE_NOT_VERIFIED"
    info["internet_profiles"] = internet_profiles
    info["isolation_checks"] = checks
    info["isolation_detail"] = {"physical_adapters_up": physical_up, "adapters_with_default_route_up": route_up,
                                "vpn_like_adapters_up": vpn_up,
                                "virtual_adapters_up_without_default_route": virtual_up_no_route,
                                "note": "Virtual adapters without a default route (e.g. VMware host-only/NAT) "
                                        "do not fail isolation. A VPN adapter fails it only if it holds a default "
                                        "route or any external probe succeeds."}
    info["isolation_verdict"] = verdict
    return info


def http(method, url, body=None, timeout=60):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
    # Loopback only; bypass any system proxy explicitly.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    t0 = time.perf_counter()
    try:
        with opener.open(req, timeout=timeout) as r:
            status, payload = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, payload = e.code, e.read()
    ms = (time.perf_counter() - t0) * 1000
    try:
        parsed = json.loads(payload)
    except ValueError:
        parsed = {"raw": payload[:500].decode("utf-8", "replace")}
    return status, parsed, round(ms, 2)


def port_free(port):
    with socket.socket() as s:
        s.settimeout(1)
        return s.connect_ex(("127.0.0.1", port)) != 0


def validate(resp, request_id):
    problems = []
    inf = resp.get("inference") or {}
    checks = {"ok": resp.get("ok") is True, "request_id": resp.get("request_id") == request_id,
              "model_manifest_hash": inf.get("model_manifest_hash") == EXPECTED["model_manifest_hash"],
              "score_semantics": inf.get("score_semantics") == "UNCALIBRATED",
              "taxonomy": (inf.get("taxonomy_id"), inf.get("taxonomy_version")) == ("verimod-ko-beep-hate", "1"),
              "input_status": inf.get("input_status") in ("FULL", "TRUNCATED"),
              "content_commitment_echo": inf.get("content_commitment") == PROBE["content_commitment"],
              "scores_keys": set((inf.get("scores_ppm") or {})) == {"hate", "offensive"},
              "scores_range": all(isinstance(v, int) and 0 <= v <= 1_000_000
                                  for v in (inf.get("scores_ppm") or {}).values())}
    try:
        sys.path.insert(0, str(ROOT / "ai/src"))
        from verimod_ai.inference.w3_handoff import validate_i1
        validate_i1(resp)
        checks["validate_i1"] = True
    except Exception as exc:
        checks["validate_i1"] = False
        problems.append(f"validate_i1: {type(exc).__name__}")
    return checks, problems


def serve_and_infer(port, log_path):
    result = {"port": port, "server_log": log_path.name}
    if not port_free(port):
        result.update(status="SERVER_START_FAILED", detail=f"port {port} already in use; existing process not touched")
        return result
    env = dict(os.environ, HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1", HF_DATASETS_OFFLINE="1",
               PYTHONIOENCODING="utf-8")
    cmd = [str(PY), "-B", str(SERVE), "--host", "127.0.0.1", "--port", str(port)]
    result["command"] = "ai/.venv/Scripts/python.exe -B ai/scripts/serve_w4_inference.py --host 127.0.0.1 --port %d" % port
    with log_path.open("w", encoding="utf-8") as log:
        t_start = time.perf_counter()
        proc = subprocess.Popen(cmd, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
        result["server_pid"] = proc.pid
        try:
            base = f"http://127.0.0.1:{port}"
            health = None
            deadline = time.time() + 240
            while time.time() < deadline:
                if proc.poll() is not None:
                    break
                try:
                    status, body, _ = http("GET", base + "/healthz", timeout=5)
                    health = {"status": status, "body": body}
                    if status in (200, 503) and isinstance(body, dict) and "ready" in body:
                        break
                except OSError:
                    pass
                time.sleep(1)
            result["startup_ms"] = round((time.perf_counter() - t_start) * 1000, 1)
            result["healthz"] = health
            if proc.poll() is not None:
                result.update(status="SERVER_START_FAILED", detail=f"server exited code {proc.returncode}")
                return result
            if not health:
                result.update(status="SERVER_START_FAILED", detail="healthz not reachable within 240s")
                return result
            if health["status"] != 200:
                result.update(status="INFERENCE_UNAVAILABLE", detail="healthz 503: model not ready")
                return result
            status, body, ms = http("POST", base + "/infer", PROBE, timeout=30)
            result["infer_first"] = {"status": status, "latency_ms": ms, "response": body}
            warm = []
            for i in range(5):
                s, _, m = http("POST", base + "/infer", dict(PROBE, request_id=f"w6_ai19_warm_{i}"), timeout=30)
                warm.append({"status": s, "latency_ms": m})
            result["infer_warm"] = warm
            fc_status, fc_body, _ = http("POST", base + "/infer", dict(PROBE, text="   ", request_id="w6_ai19_empty"))
            result["fail_closed_empty_input"] = {"status": fc_status, "response": fc_body,
                                                 "pass": fc_status == 400 and (fc_body.get("error") or {}).get("code") == "EMPTY_INPUT"
                                                 and "inference" not in fc_body}
            if status != 200:
                code = (body.get("error") or {}).get("code") if isinstance(body, dict) else None
                result.update(status="INFERENCE_TIMEOUT" if code == "INFERENCE_TIMEOUT" else "INFERENCE_UNAVAILABLE",
                              detail=f"/infer HTTP {status} {code}")
                return result
            checks, problems = validate(body, PROBE["request_id"])
            result["contract_checks"] = checks
            result["contract_problems"] = problems
            result["status"] = "OK" if all(checks.values()) else "CONTRACT_MISMATCH"
            return result
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=20)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait(timeout=10)
            result["server_exit_code"] = proc.returncode
            result["server_stopped"] = proc.poll() is not None


def classify(report):
    a = report.get("artifacts") or {}
    if not a.get("weights", {}).get("exists"):
        return "MODEL_NOT_FOUND"
    if not (a["weights"]["match"] and a["config"]["match"] and a["manifest"]["match"]):
        return "ARTIFACT_HASH_MISMATCH"
    if not a.get("snapshot_exists") or not all(a.get("tokenizer_snapshot_files", {}).values()):
        return "TOKENIZER_NOT_CACHED"
    if any(v["mismatches"] for v in report["environment"]["lock_check"].values()):
        return "DEPENDENCY_MISMATCH"
    srv = report.get("server") or {}
    if srv.get("status") != "OK":
        return srv.get("status") or "SERVER_START_FAILED"
    if report["mode"] == "physical-offline" and report["network"]["isolation_verdict"] != "PHYSICAL_OFFLINE_VERIFIED":
        return "NETWORK_ISOLATION_NOT_VERIFIED"
    return "OK"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=("online-config", "physical-offline"), required=True)
    ap.add_argument("--port", type=int, default=8099)
    ap.add_argument("--out-dir", default=str(HERE))
    args = ap.parse_args()
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    out_dir = Path(args.out_dir)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    name = "online-offline-config-smoke" if args.mode == "online-config" else "physical-offline-result"
    out = out_dir / f"{name}.json"
    if out.exists():
        out = out_dir / f"{name}-{stamp}.json"
    report = {"owner": "A / 주진호", "ticket": "AI-19", "mode": args.mode, "started": now(),
              "hf_hub_offline": os.environ.get("HF_HUB_OFFLINE"),
              "transformers_offline": os.environ.get("TRANSFORMERS_OFFLINE")}
    try:
        report["git"] = git_state()
        report["network"] = network_state()
        report["environment"] = environment()
        report["artifacts"] = artifacts()
        report["server"] = serve_and_infer(args.port, out_dir / f"server-{args.mode}-{stamp}.log")
        report["network_after"] = network_state()["isolation_verdict"]
    except Exception:
        report["exception"] = traceback.format_exc()[-3000:]
    report["finished"] = now()
    try:
        report["classification"] = classify(report)
    except Exception:
        report["classification"] = "PROBE_ERROR"
    if args.mode == "online-config":
        report["ai19_verdict"] = ("OFFLINE_CONFIG_ONLY" if report["classification"] in ("OK",) else "FAIL_OR_BLOCKED")
    else:
        report["ai19_verdict"] = ("PASS_CANDIDATE" if report["classification"] == "OK" else
                                  "PARTIAL" if report["classification"] == "NETWORK_ISOLATION_NOT_VERIFIED" else
                                  "BLOCKED_OR_FAIL")
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"[AI-19] mode={args.mode} classification={report['classification']} verdict={report['ai19_verdict']}")
    print(f"[AI-19] network={report.get('network', {}).get('isolation_verdict')} result={out.name}")
    return 0 if report["classification"] == "OK" else 2


if __name__ == "__main__":
    sys.exit(main())
