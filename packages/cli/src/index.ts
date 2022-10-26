#!/usr/bin/env node
import { program } from 'commander';
import './deploy';
import './dev';

program.parse(process.argv);
