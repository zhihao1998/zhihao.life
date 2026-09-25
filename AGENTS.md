## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Remote deployment

Production site: https://zhihao.life

SSH into the host with Aliyun Workbench:

```
workbench connect -i i-2zealrv1ip22tasm313b
workbench exec -i i-2zealrv1ip22tasm313b -c '…'
```

Static files are served by nginx from `/var/www/zhihao.life/`. The ECS has Hugo but not Node — build `dist/` locally, then upload and rsync onto the host (do not run `rsync --delete` until photo backups are confirmed).

### Photography (do not delete)

Remote originals and Hugo-era builds live **outside** the git tree:

| Path | What |
|------|------|
| `/home/wang/zhihao-photos-backup/content-portfolio/` | Hugo source album JPEGs (~1.5G; moved from `content/portfolio`) |
| `/home/wang/zhihao-photos-backup/www-portfolio/` | Previous nginx portfolio tree (~1.6G) |
| `/home/wang/zhihao-photos-backup/images/` | Misc site images |

Local web-sized albums: `src/assets/photos/` (gitignored; sync with `npm run sync:photos`). Never wipe the backup dirs when deploying.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
