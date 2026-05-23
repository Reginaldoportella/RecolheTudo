const { spawn } = require('child_process');
const path = require('path');

const expoCli = require.resolve('@expo/cli/build/bin/cli');

const child = spawn(process.execPath, [expoCli, 'start', '--web'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_NO_DEPENDENCY_VALIDATION: '1',
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
