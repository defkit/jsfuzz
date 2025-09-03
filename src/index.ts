#!/usr/bin/env node
import {Fuzzer} from './fuzzer';
import {MutationFunction} from './corpus';
import * as yargs from 'yargs';
import * as path from 'path';

function startFuzzer(argv: any) {
    let customMutationFn: MutationFunction | undefined = undefined;
    
    // Load custom mutation function from the same module as the fuzz target
    try {
        const targetPath = path.resolve(argv.target);
        const targetModule = require(targetPath);
        
        // Check if the module exports a `mutate` function
        if (typeof targetModule.mutate === 'function') {
            customMutationFn = targetModule.mutate;
            console.log(`Using custom mutation function from: ${targetPath}`);
        }
        
        // Validate that `fuzz` function exists
        if (typeof targetModule.fuzz !== 'function') {
            console.error(`Error: ${targetPath} must export a 'fuzz' function`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`Error loading target module: ${error}`);
        process.exit(1);
    }
    
    const fuzzer = new Fuzzer(
        argv.target,
        argv.dir,
        argv.exactArtifactPath,
        argv.rssLimitMb,
        argv.timeout,
        argv.regression,
        argv.onlyAscii,
        argv.versifier, 
        argv.fuzzTime,
        customMutationFn);
    fuzzer.start()
}

yargs.scriptName("jsfuzz")
    .command('$0 <target> [dir..]', 'start the fuzzer', (yargs: any) => {
        yargs.positional('target', {
            describe: 'Path to file containing the fuzz target function',
            type: 'string'
        });
        yargs.positional('dir', {
            describe: `Pass zero or more corpus directories as command line arguments. The fuzzer will read test inputs from each of these corpus directories, and any new test inputs that are generated will be written back to the first corpus directory. single files can be passed as well and will be used as seed files`,
            type: 'string'
        });
    }, (argv: any) => startFuzzer(argv))
    .option('regression', {
        type: 'boolean',
        description: 'run the fuzzer through set of files for regression or reproduction',
        default: false
    })
    .option('exact-artifact-path', {
        type: 'string',
        description: 'set exact artifact path for crashes/ooms'
    })
    .option('rss-limit-mb', {
        type: 'number',
        description: 'Memory usage in MB',
        default: 2048,
    })
    .option('timeout', {
        type: 'number',
        description: 'If input takes longer then this timeout (in seconds) the process is treated as failure case',
        default: 30,
    })
    .option('worker', {
        type: 'boolean',
        description: 'run fuzzing worker',
        default: false,
        hidden: true
    })
    .option('versifier', {
        type: 'boolean',
        description: 'use versifier algorithm (good for text based protocols)',
        default: true,
    })
    .option('only-ascii', {
        type: 'boolean',
        description: 'generate only ASCII (isprint+isspace) inputs',
        default: false,
    })
    .option('fuzzTime', {
        type: 'number',
        description: 'The time(in seconds) of fuzzing during which there are no changes in the coverage. 0 is unlim.',
        default: 0,
    })
    .help()
    .argv;