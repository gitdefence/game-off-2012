<?php
$addr = $_SERVER['REMOTE_ADDR'];

$payload = json_decode($_POST['payload']);
$branch = explode('/', $payload->ref);
$branch = $branch[2];
$safe_branch = escapeshellarg($branch);
echo "Branch: $safe_branch";
exec("echo 'Update to $safe_branch from $addr, pulling master.' >> gitdefence.log");
$safe_branch = "master";

exec("git checkout $safe_branch >> ../gitdefence.log 2>&1");
exec("git checkout . >> ../gitdefence.log 2>&1");
exec("git pull origin $safe_branch >> ../gitdefence.log 2>&1");
