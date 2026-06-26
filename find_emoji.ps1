[Console]::OutputEncoding = [Text.Encoding]::UTF8

$files = @(
    'workm-app\src\components\homepage\HpBasicSettings.tsx',
    'workm-app\src\pages\admin\accounting\AcctAccountsMgmt.tsx',
    'workm-app\src\components\homepage\HpBoardMgmt.tsx',
    'workm-app\src\pages\admin\accounting\AcctApproval.tsx',
    'workm-app\src\pages\admin\accounting\AcctBudget.tsx',
    'workm-app\src\pages\admin\HQInfoPage.tsx',
    'workm-app\src\pages\admin\accounting\AcctPayMethods.tsx',
    'workm-app\src\components\accounting\PrintApprovalForm.tsx'
)

# Common emoji patterns
$emojiPattern = '[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{2B05}-\u{2B07}]|[\u{2795}-\u{2797}]|\u{274C}|\u{2705}|\u{26A1}|\u{2699}|\u{270F}'

foreach ($f in $files) {
    if (Test-Path $f) {
        $content = Get-Content $f -Encoding UTF8
        $lineNum = 0
        foreach ($line in $content) {
            $lineNum++
            if ($line -match $emojiPattern) {
                Write-Output "${f}:${lineNum}: $($line.Trim().Substring(0, [Math]::Min(200, $line.Trim().Length)))"
            }
        }
    }
}
