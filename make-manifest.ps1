$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$f = @(Get-ChildItem -Path $d -File | Where-Object { $_.Extension -match '^\.(json|ewb)$' -and $_.Name -notmatch '^(bibles|package|manifest)|backup' } | Sort-Object Name | ForEach-Object { [pscustomobject]@{ name = $_.Name; sha = "$($_.Length)-$($_.LastWriteTimeUtc.Ticks)" } })
$j = ConvertTo-Json -InputObject $f
[IO.File]::WriteAllText((Join-Path $d 'bibles.json'), $j, (New-Object Text.UTF8Encoding $false))
Write-Host "bibles.json now lists $($f.Count) Bible file(s):"
$f | ForEach-Object { Write-Host " - $($_.name)" }
