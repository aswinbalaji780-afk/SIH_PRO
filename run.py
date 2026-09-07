#!/usr/bin/env python3
"""
Launcher script for the National Skill Intelligence & Learning Platform
MoSPI / NSSTA / iGOT Karmayogi Capacity Building Platform
"""
import sys
import socket
import uvicorn
from dotenv import load_dotenv
load_dotenv()
from backend.core.config import settings

def find_available_port(host: str, start_port: int, max_attempts: int = 20) -> int:
    """Finds the first available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, port))
                return port
            except OSError:
                continue
    return start_port

if __name__ == "__main__":
    target_host = settings.HOST
    preferred_port = settings.PORT
    actual_port = find_available_port(target_host, preferred_port)

    if actual_port != preferred_port:
        print(f"\n[!] Note: Port {preferred_port} is busy or restricted on your system.")
        print(f"[+] Automatically switched to available port: {actual_port}\n")

    display_host = "localhost" if target_host in ["0.0.0.0", ""] else target_host

    print("=" * 70)
    print(" NATIONAL SKILL INTELLIGENCE & LEARNING PLATFORM")
    print(" Official Statistical System (MoSPI / NSSTA / iGOT Karmayogi)")
    print("=" * 70)
    print(f" Server Port: {actual_port}")
    print(f" Web UI URL : http://{display_host}:{actual_port}/")
    print(f" Local URL  : http://127.0.0.1:{actual_port}/")
    print(f" API Docs   : http://{display_host}:{actual_port}/docs")
    print("=" * 70)

    try:
        uvicorn.run("backend.main:app", host=target_host, port=actual_port, reload=False)
    except Exception as e:
        print(f"\nError launching server: {e}")
        sys.exit(1)
