<?php
$addr = $_SERVER['REMOTE_ADDR'];

$payload = json_decode($_POST['payload']);
$branch = explode('/', $payload->ref);
$branch = $branch[2];
$safe_branch = escapeshellarg($branch);
echo "Branch: $safe_branch";
exec("echo 'pulling down $safe_branch from $addr' >> gitdefence.log");

if (is_dir($branch) === TRUE) {
	chdir($branch);
	exec("git checkout $safe_branch >> ../gitdefence.log 2>&1");
	exec("git checkout . >> ../gitdefence.log 2>&1");
	exec("git pull origin $safe_branch >> ../gitdefence.log 2>&1");
} else {
	exec("echo 'creating new repo for branch $safe_branch' >> gitdefence.log");
	exec("git clone git://github.com/gitdefence/game-off-2012 $safe_branch >> gitdefence.log 2>&1");
	chdir($branch);
	exec("git checkout $safe_branch >> ../gitdefence.log 2>&1");
}
