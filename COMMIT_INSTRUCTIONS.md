# Commit and push to GitHub

Run these in PowerShell from the project root (`c:\Users\markg\Downloads\Kurpur`):

**1. Stage the wallet card changes**
```powershell
git add src/app/dashboard/page.tsx src/components/dashboard/WalletCard.tsx src/lib/utils.ts
```

**2. Commit**
```powershell
git commit -m "Redesign wallet card with Kurpur branding and cardholder name from email"
```

**3. Push to GitHub**
```powershell
git push origin main
```

To stage and commit *all* modified files (including activity and insights pages):
```powershell
git add -A
git commit -m "Redesign wallet card with Kurpur branding and cardholder name from email"
git push origin main
```
