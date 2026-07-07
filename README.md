# DANSSHIP-UI

Clone the repository

```sh
git clone git@github.com:codership-co/dansship-ui.git
cd dansship-ui
```

This repo only works with `pnpm@11.2.2`, so install it with 

```sh
corepack enable
pnpm -v
```

Configure local host for Dansship, adding the next line to your file `/etc/hosts`

```
127.0.0.1	localhost.dansship.com
```

Configure .env.local file (Remember to add the backend host for variable `VITE_DANSSHIP_API_URL`)

```sh
cp env.template .env.local
```

Install dependencies

```sh
pnpm i
```

Run the project with

```sh
pnpm dev
```

Open local url on  [http://localhost.dansship.com](http://localhost.dansship.com)
