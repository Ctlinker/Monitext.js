#!/usr/bin/env ts-node

import { TypeAssertionCLI } from "./cmd";
import "./cmds/drun"

TypeAssertionCLI.parse(process.argv);
