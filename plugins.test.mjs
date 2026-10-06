import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

// One package folder serves both hosts: Claude Code reads `.claude-plugin/`
// and `.mcp.json`; Codex reads the agent-plugins `plugin.json` and `mcp.json`.
const root = import.meta.dirname;
const mcpUrl = 'https://www.cathar.one/mcp';
const schemas = 'https://agent-plugins.org/schemas/1.0.0';
// Compare as LF text and `/` paths, so a Windows checkout passes too.
const read = (path) => readFileSync(join(root, path), 'utf8').replaceAll('\r\n', '\n');
const json = (path) => JSON.parse(read(path));
// In the exported repository this folder is the root, and its `.git` isn't published.
const files = (dir = root) =>
  readdirSync(dir)
    .filter((name) => name !== '.git')
    .flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return files(path);
      return [relative(root, path).replaceAll('\\', '/')];
    });

test('both marketplaces list the one catharone package', () => {
  const claude = json('.claude-plugin/marketplace.json');
  const codex = json('.agents/plugins/marketplace.json');
  for (const marketplace of [claude, codex]) {
    assert.equal(marketplace.name, 'catharone');
    assert.deepEqual(
      marketplace.plugins.map((plugin) => plugin.name),
      ['catharone'],
    );
  }
  assert.equal(claude.plugins[0].source, './catharone');
  // Claude Code resolves the version from plugin.json first; set it only there.
  assert.equal(claude.plugins[0].version, undefined);
  assert.deepEqual(codex.plugins[0].source, { source: 'local', path: './catharone' });
  assert.deepEqual(codex.plugins[0].policy, {
    installation: 'AVAILABLE',
    authentication: 'ON_INSTALL',
  });
});

test('the two host manifests describe the same release', () => {
  const claude = json('catharone/.claude-plugin/plugin.json');
  const { $schema, extensions, ...codex } = json('catharone/plugin.json');
  assert.equal($schema, `${schemas}/plugin.schema.json`);
  assert.deepEqual(codex, claude);
  assert.equal(claude.name, 'catharone');
  assert.match(claude.version, /^\d+\.\d+\.\d+$/);
  assert.equal(
    extensions['com.openai'].interface.privacyPolicyURL,
    'https://www.cathar.one/privacy',
  );
});

test('each host reaches only the frozen MCP URL', () => {
  assert.deepEqual(json('catharone/.mcp.json'), {
    mcpServers: { catharone: { type: 'http', url: mcpUrl } },
  });
  assert.deepEqual(json('catharone/mcp.json'), {
    $schema: `${schemas}/mcp.schema.json`,
    mcpServers: { catharone: { type: 'streamable-http', url: mcpUrl } },
  });
});

test('the skill never loads implicitly and names only implemented tools', () => {
  const skill = read('catharone/skills/catharone/SKILL.md');
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? '';
  assert.match(frontmatter, /^name: catharone$/m);
  assert.match(frontmatter, /^disable-model-invocation: true$/m);
  // Codex ignores an unreadable policy with only a warning, so pin the text.
  assert.equal(
    read('catharone/skills/catharone/agents/openai.yaml'),
    'policy:\n  allow_implicit_invocation: false\n',
  );
  const named = new Set(skill.match(/\bcatharone_[a-z_]+\b/g));
  assert.equal(named.size, 8);
  // The backend is not exported with the packages. Inside the monorepo a moved
  // server file must fail here rather than silently skip the comparison.
  const backend = join(root, '../supabase');
  if (existsSync(backend)) {
    const server = readFileSync(join(backend, 'functions/mcp/server.ts'), 'utf8');
    const registered = new Set(
      [...server.matchAll(/registerTool\(\s*'([a-z_]+)'/g)].map((m) => m[1]),
    );
    assert.deepEqual([...named].sort(), [...registered].sort());
  }
});

test('published files hold no credentials, private links, scripts or hooks', () => {
  const published = files().filter((path) => path !== 'plugins.test.mjs');
  for (const path of published) {
    assert.match(path, /(^|\/)(LICENSE|[\w.-]+\.(json|md|yaml))$/, path);
    assert.doesNotMatch(path, /(^|\/)(hooks|bin|scripts)\//, path);
    assert.doesNotMatch(
      read(path),
      /supabase\.co|sb_(secret|publishable)_|\bsk-[A-Za-z0-9]|eyJ[A-Za-z0-9_-]{10,}|localhost|127\.0\.0\.1|xysoft-dev\/catharone(?!-plugins)\b|"command"\s*:/,
      path,
    );
  }
});
