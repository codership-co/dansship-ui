# Publishing the UI

Decision: ADR-065 (workspace repo, `context/import/03_Bitacora_Decisiones_Arquitectura.md`).

- Vercel is unchanged: every PR gets a preview, and every merge to `main` gets a Preview deployment served as dev.
- Production: Actions → **Promote to production** → Run workflow (empty commit = the latest commit of `main`). It promotes that commit's Preview deployment to production; Vercel builds the same commit again with the production environment variables, exactly like the "Promote" button in the Vercel dashboard. Only the repository variable `DEPLOY_APPROVER` can run it; for anyone else the job is skipped.
- Order with the API is the owner's call (accepted risk): publish the API first when the UI needs a new endpoint.

## One-time setup (owner)

Create a Vercel token (Vercel → Account Settings → Tokens, scoped to the Dansship team) and run, from this repository:

```bash
REPO=codership-co/dansship-ui
# Environment that holds the token; only main can use it.
gh api -X PUT "repos/$REPO/environments/vercel-production" \
  --input - <<<'{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}'
gh api -X POST "repos/$REPO/environments/vercel-production/deployment-branch-policies" -f name=main
gh secret set VERCEL_TOKEN --repo "$REPO" --env vercel-production   # paste the token when asked
gh variable set DEPLOY_APPROVER --repo "$REPO" --body "$(gh api user --jq .login)"
gh variable set VERCEL_SCOPE --repo "$REPO" --body "<vercel team slug>"
```

Then run **Promote to production** once on a commit that is already live in production to check the setup.
