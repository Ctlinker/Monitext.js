#!/usr/bin/env tsx
import { argv } from "node:process";
import { Script } from "./lib/command";
import "./lib/all-cmds"

Script.parse(argv)