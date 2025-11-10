@echo off
chcp 65001 > nul
echo ================================================
echo   Загрузка конструктора съемки на GitHub
echo ================================================
echo.

cd /d "%~dp0"

echo [1/4] Проверка git...
git --version
if errorlevel 1 (
    echo ОШИБКА: Git не установлен!
    echo Скачайте с https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo [2/4] Добавление remote репозитория...
git remote remove origin 2>nul
git remote add origin https://github.com/creativefastfood/shooting-calculator.git

echo.
echo [3/4] Переименование ветки в main...
git branch -M main

echo.
echo [4/4] Загрузка на GitHub...
echo.
echo ВНИМАНИЕ: Сейчас откроется окно для ввода credentials.
echo.
echo Username: ваш GitHub username
echo Password: используйте Personal Access Token (НЕ обычный пароль!)
echo.
echo Как создать токен: https://github.com/settings/tokens
echo.
pause

git push -u origin main

echo.
if errorlevel 1 (
    echo.
    echo ❌ ОШИБКА при загрузке!
    echo.
    echo Возможные причины:
    echo 1. Репозиторий не создан на GitHub
    echo 2. Неверный токен или пароль
    echo 3. Нет прав доступа
    echo.
    echo Решение:
    echo 1. Создайте репозиторий: https://github.com/new
    echo    Название: shooting-calculator
    echo    Type: Public
    echo    НЕ добавляйте README!
    echo.
    echo 2. Создайте токен: https://github.com/settings/tokens
    echo    Права: repo
    echo.
    echo 3. Попробуйте снова
    echo.
) else (
    echo.
    echo ✅ УСПЕШНО ЗАГРУЖЕНО!
    echo.
    echo Теперь включите GitHub Pages:
    echo 1. Откройте: https://github.com/creativefastfood/shooting-calculator/settings/pages
    echo 2. Source: main branch, / (root)
    echo 3. Save
    echo.
    echo Через 2 минуты сайт будет доступен:
    echo https://creativefastfood.github.io/shooting-calculator/
    echo.
    echo Открыть настройки GitHub Pages?
    choice /C YN /M "Открыть"
    if errorlevel 2 goto end
    start https://github.com/creativefastfood/shooting-calculator/settings/pages
)

:end
echo.
pause
