# Catharone for Claude Code and Codex

Connect your own Claude Code or Codex to your Catharone account. After you approve access on the Catharone website, your agent can, when you ask:

- **Talk with your Catharone companion** in a conversation of its own. You can read it, but not reply in it, in the Catharone app.
- **Check in.** Catharone picks one to three light questions, your agent talks them through with you, and it submits a short summary only after you approve it.
- **Tell Catharone who you'd like to meet.** Your agent sends your own words, and Catharone adds them to *People I'd like to meet*, labelled as added through your agent. You pause, edit or remove them in the app.

The `catharone` plugin adds one skill and the Catharone MCP server at `https://www.cathar.one/mcp`. It has no hooks, scripts or local servers, so it runs nothing on your machine. Its instructions tell your agent never to send your agent's memory, instruction files, other files or earlier chats.

## Requirements

- A Catharone account with AI processing turned on in the app.
- Claude Code 2.1.199 or later, or Codex 0.160.0 or later.

## Install

### Claude Code

```text
claude plugin marketplace add xysoft-dev/catharone-plugins
claude plugin install catharone@catharone
```

Restart Claude Code, run `/mcp`, choose `plugin:catharone:catharone` and sign in. Your browser opens the Catharone website, where you sign in with your phone number and approve access.

### Codex

```text
codex plugin marketplace add xysoft-dev/catharone-plugins
codex plugin add catharone@catharone
codex mcp login catharone
```

The last command opens the Catharone website, where you sign in with your phone number and approve access. Start a new Codex session afterwards. If a session later says the server isn't signed in, run `codex mcp login catharone` again.

## Use

Ask in your own words, for example "check in with Catharone" or "tell Catharone I'd like to meet someone who also plays tennis". The skill never loads on its own. You can also call it directly: `/catharone:catharone` in Claude Code, or type `$` and choose `catharone:catharone` in Codex. By default, your agent asks for your approval before each write.

## What the plugin sends

The plugin's instructions tell your agent to send Catharone only what you ask it to: messages to your companion, check-in summaries you approve, your words for people you'd like to meet, and request IDs. Catharone refuses links, contact details, credentials and code in check-in summaries and requests. It processes what it receives as described in its [Privacy Policy](https://www.cathar.one/privacy), and treats it as your own words for memory and introductions, like things you say in the app.

Your agent receives companion replies, check-in questions and closed request statuses. Replies draw on what Catharone remembers about you and can reveal it. Your agent never receives candidates, other people's details, scores, a listing of your memory or the contents of your list. Catharone receives no password or other credentials from your agent, and your agent never receives your phone number. Sign-in tokens are Catharone's own and work only with this MCP server.

## Disconnect

Uninstalling the plugin does not revoke access, and your agent may keep its stored sign-in token. To disconnect, open [cathar.one/agents](https://www.cathar.one/agents) and disconnect the app; it takes effect at once. To also delete the stored token, run `claude mcp logout plugin:catharone:catharone` or `codex mcp logout catharone` before uninstalling. What a check-in or conversation already added stays as ordinary memory, which you can forget in the Catharone app.

## Update

- **Claude Code:** auto-update is off by default for third-party marketplaces. Run `claude plugin marketplace update catharone`, then `claude plugin update catharone@catharone`, and restart Claude Code. Or turn on auto-update for the `catharone` marketplace in `/plugin`.
- **Codex:** run `codex plugin marketplace upgrade catharone`, then `codex plugin add catharone@catharone` to install the new version, and start a new session.

## Transcripts and memories

Your agent can keep Catharone replies, including personal context: both hosts save session transcripts on your machine, Claude Code's auto memory can save details from a session, and Codex memories can keep replies. To keep Catharone replies out of Codex memories, set `disable_on_external_context = true` under `[memories]` in your Codex `config.toml`.

## Releasing

These packages are exported from Catharone's private source repository, where changes land first through reviewed pull requests. An export replaces this repository's contents with the source's `plugins/` folder. One folder serves both hosts: Claude Code reads `catharone/.claude-plugin/plugin.json` and `.mcp.json`, and Codex reads the agent-plugins `catharone/plugin.json` and `mcp.json`. Both share one skill. A release bumps `version` in both manifests together and never reuses a version; the marketplace entries carry none. Before a release, run `node --test plugins.test.mjs`, `claude plugin validate --strict` on `catharone` and on the repository root, and validate `catharone/plugin.json` and `catharone/mcp.json` against their agent-plugins 1.0.0 `$schema`. The `Check` workflow runs the same steps on every pull request and on `main`.

## License

Apache-2.0. Catharone is operated by XYSOFT LLC. Questions: [contact@cathar.one](mailto:contact@cathar.one).
