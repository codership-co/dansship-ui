# DANSSHIP-UI

## Requirements

- `node > 24.14.0`
- `pnpm@11.2.2`

You can install them following these commands (on MacOS)

```sh
brew install nvm          # This install node Version Manager
nvm install 24            # Install last node V24
nvm alias default 24.     # Set node v24 as default node version
nvm -v                    # Show installed node version
corepack enable           # Enable corepack from node (this enable pnpm)
pnpm -v                   # Show installed pnpm version
```

Clone the repository

```sh
git clone git@github.com:codership-co/dansship-ui.git                # Clone the repository
cd dansship-ui                                                       # Move to cloned repository
sudo echo "127.0.0.1	localhost.dansship.com" >> /etc/hosts        # Add local host configuration to allow cookies normal use on your machine
cp env.template .env.local                                           # Configure .env.local file
pnpm i                                                               # Install dependencies
pnpm dev                                                             # Run the project
```

> Remember to add the backend host for variable `VITE_DANSSHIP_API_URL` on file `.env.local`

Open local url on  [http://localhost.dansship.com](http://localhost.dansship.com)
