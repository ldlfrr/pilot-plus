@echo off
set MSG=%*
if "%MSG%"=="" set MSG=update
git add .
git commit -m "%MSG%"
git push
echo.
echo ✅ Deploye sur Vercel ! Attends ~30s puis actualise ton site.
