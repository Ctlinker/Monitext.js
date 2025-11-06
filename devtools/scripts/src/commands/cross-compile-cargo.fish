#!/usr/bin/env fish

set targets "aarch64-apple-darwin" "x86_64-apple-darwin" "x86_64-pc-windows-gnu" "x86_64-unknown-linux-gnu"

for current in $targets
    if not rustup target list --installed | grep $current 
        rustup target add $current
    end
end

# Check arguments
if test (count $argv) -lt 1; or echo $argv | grep -qE -- '--help|-h'
    echo "usage: (status filename) [path-to-cargo-pkg] [--release]"
    exit 1
end

# path to cargo pkg
cd "$argv[1]" 

for target in $targets
    echo ""
    echo "Current target build : $target"
    if echo $argv | grep -q -- "--release"  
        cargo build --release --target $target
    else
        cargo build --target  $target
    end
end