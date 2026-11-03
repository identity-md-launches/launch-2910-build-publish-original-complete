"""Publishable, read-only Git snapshot; never reads or changes the working repo's .git.
Run after building dist/. Rebuild once afterwards to copy the snapshot into dist/.
The source mirror excludes itself at public/ and dist/ to prevent recursion.
"""
from pathlib import Path
import os
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / 'public' / 'source-repository'
ENV = {'PATH': os.defpath, 'LANG': 'C.UTF-8', 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': os.devnull,
       'GIT_AUTHOR_NAME': 'Squeek Burrow Circuit', 'GIT_AUTHOR_EMAIL': '',
       'GIT_COMMITTER_NAME': 'Squeek Burrow Circuit', 'GIT_COMMITTER_EMAIL': ''}
# Include only assignment outputs. Never scan machine/configuration/input directories.
FILES = ['.gitignore', 'index.html', 'package.json', 'package-lock.json',
         'tsconfig.json', 'vite.config.ts', 'README.md', 'DESIGN.md', 'LICENSE']
DIRS = ['src', 'scripts', 'test', 'public', 'dist', 'docs']
EXCLUDED = {'node_modules', '.npm', '.cache', '.vite', '.git', 'source-repository',
            'scratch', '__pycache__', '.playwright-mcp'}

def main():
    with tempfile.TemporaryDirectory(prefix='squeek-source-') as tmp:
        stage = Path(tmp) / 'tree'
        repo = Path(tmp) / 'repository'
        stage.mkdir()
        for filename in FILES:
            source = ROOT / filename
            if not source.is_file():
                raise RuntimeError(f'Missing delivery file: {filename}')
            shutil.copy2(source, stage / filename)
        for dirname in DIRS:
            source = ROOT / dirname
            if source.is_dir():
                shutil.copytree(source, stage / dirname,
                    ignore=lambda directory, names: [name for name in names if name in EXCLUDED or name.endswith('.tsbuildinfo')])
        def git(*args, input=None):
            return subprocess.check_output(['git', '--git-dir=' + str(repo), '--work-tree=' + str(stage), *args],
                                           env=ENV, input=input, stderr=subprocess.PIPE).decode().strip()
        subprocess.run(['git', 'init', '--bare', '--initial-branch=main', '--template=', str(repo)],
                       env=ENV, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        git('add', '--all', '--force')
        tree = git('write-tree')
        commit = git('commit-tree', tree, input=b'Squeek Burrow Circuit: complete source and static export\n')
        git('update-ref', 'refs/heads/main', commit)
        git('repack', '-ad')
        git('prune-packed')
        git('update-server-info')
        git('fsck', '--full')
        # The staging index and reflogs are unnecessary in a read-only public mirror.
        (repo / 'index').unlink(missing_ok=True)
        shutil.rmtree(repo / 'logs', ignore_errors=True)
        (repo / 'description').write_text('Squeek Burrow Circuit complete source snapshot\n')
        (repo / 'index.html').write_text(LANDING)
        if TARGET.exists():
            shutil.rmtree(TARGET)
        shutil.copytree(repo, TARGET)
        total = sum(p.stat().st_size for p in TARGET.rglob('*') if p.is_file())
        print(f'Static Git source repository: {commit}; {total:,} bytes')

LANDING = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Squeek Burrow Circuit · Source repository</title><meta name="description" content="The complete source code and production export of Squeek Burrow Circuit, available as a public read-only Git repository."><link rel="icon" href="../favicon.svg"><style>body{background:#f7efdb;color:#403b2e;font:16px/1.65 system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 24px}h1{font:600 32px/1.2 Georgia,serif;color:#23554c}a{color:#23554c}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#fffbf1;border-radius:12px;padding:20px}button{font:inherit;padding:10px 16px;background:#23554c;color:#fffbf1;border:0;border-radius:8px;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #23554c;outline-offset:4px}</style><main><a href="../">← Play Squeek Burrow Circuit</a><h1>The complete source repository</h1><p>This is a real, public, read-only Git repository served over static HTTP. It contains the game source, authored levels, tests, documentation, local art and fonts, package lockfile, and the production export. The repository is a single delivery snapshot; it has no remote service or sign-in.</p><p>Clone it with Git:</p><pre id="clone">Loading the repository URL…</pre><button type="button" id="copy">Copy clone command</button><p>Then open the README in the cloned folder. Build with Node.js 22.12 or newer and <code>npm ci &amp;&amp; npm run build</code>. The generated source mirror is omitted from its own snapshot to avoid recursion.</p><p>Source is MIT licensed; bundled fonts retain their own licenses. <a href="info/refs">Repository refs</a> · <a href="HEAD">Default branch</a></p></main><script>const command='git clone '+new URL('./',location.href).href+' squeek-burrow-circuit';document.getElementById('clone').textContent=command;document.getElementById('copy').onclick=async()=>{try{await navigator.clipboard.writeText(command);document.getElementById('copy').textContent='Copied'}catch{document.getElementById('copy').textContent='Select and copy the command above'}};</script></html>'''
if __name__ == '__main__':
    main()
