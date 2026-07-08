# DANSSHIP-UI

## Requirements

- `node > 24.14.0`
- `pnpm@11.2.2`
- `vercel-cli`

You can install them copying these commands (on MacOS)

```sh
brew install nvm                                             # This install node Version Manager
nvm install 24                                               # Install last node V24
nvm alias default 24.                                        # Set node v24 as default node version
nvm -v                                                       # Show installed node version
corepack enable                                              # Enable corepack from node (this enable pnpm)
pnpm -v                                                      # Show installed pnpm version
git clone git@github.com:codership-co/dansship-ui.git        # Clone the repository
cd dansship-ui                                               # Move to cloned repository
brew install vercel-cli                                      # Installing vercel CLI
vercel login                                                 # Login to vercel account
vercel link                                                  # Connect repository to vercel's project
vercel env pull                                              # Configure .env.local file
sudo echo "127.0.0.1 localhost.dansship.com" >> /etc/hosts   # Add local host configuration to allow cookies normal use on your machine
pnpm i                                                       # Install dependencies
pnpm dev                                                     # Run the project
```

Open local url on  [http://localhost.dansship.com](http://localhost.dansship.com)
