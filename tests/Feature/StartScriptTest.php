<?php

/**
 * start.sh launches the queue worker and the scheduler in the background,
 * and nothing else restarts them: the worker stops on purpose every hour, so
 * without a loop queued mail stopped an hour after each deploy (QA-03).
 */
function startScript(): string
{
    return file_get_contents(base_path('start.sh'));
}

it('runs the queue worker and the scheduler under the restart loop', function () {
    $script = startScript();

    expect($script)
        ->toMatch('/^keep_running php artisan queue:work .*&$/m')
        ->toMatch('/^keep_running php artisan schedule:work &$/m')
        ->not->toMatch('/^php artisan (queue:work|schedule:work)/m')
        ->not->toContain('--daemon');
});

it('restarts a background command after it fails, even under set -e', function () {
    if (PHP_OS_FAMILY === 'Windows') {
        $this->markTestSkipped('Needs a native bash; CI runs it on Linux.');
    }

    $loop = [];
    preg_match('/^keep_running\(\) \{.*?^\}$/ms', startScript(), $loop);
    expect($loop)->not->toBeEmpty();

    $check = "set -e\n{$loop[0]}\nsleep() { :; }\nn=0\n"
        .'flaky() { n=$((n+1)); echo "run $n"; [ $n -ge 3 ] && exit 0; return 7; }'."\nkeep_running flaky\n";

    $output = shell_exec('bash -c '.escapeshellarg($check).' 2>&1');

    expect($output)->toContain('run 1')->toContain('run 2')->toContain('run 3');
});
