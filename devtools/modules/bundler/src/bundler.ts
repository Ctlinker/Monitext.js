import { createTSCBundle } from "./dtsbuilder";
import { type BuildOptions } from "esbuild";
import { EsbuildBuilder, OutputFormat } from "./esbuilder";
import { dfsResolvePaths } from "./resolvepath";

interface BundleConfig {
    dirname: string;
    label?: string;
    options: {
        entryPoints: string[];
        tsconfig: string;
        target: string;
        platform: string;
    } & ({ outfile: string, outdir?: never } | { outdir: string, outfile?: never } )& Partial<BuildOptions>;
    types?: {
        entry: string;
        outDir: string;
        tsconfig: string;
    };
    variants: {
        external: string[];
        bundle: boolean;
        minify: boolean;
        minifyIdentifiers?: boolean;
        minifySyntax?: boolean;
        minifyWhitespace?: boolean;
        treeShaking?: boolean;
    }[];
    output: OutputFormat["format"][];
    postbuild?: () => void | Promise<void>;
    prebuild?: () => void | Promise<void>;
}

export async function bundleWithConfig(config: BundleConfig) {
    if (config.prebuild) {
        console.log(
            "\n🔄",
            config.label || "EsbuildBundle",
            " Running pre-build tasks...",
            "\n",
        );
        try {
            await config.prebuild();
            console.log("✅ Pre-build succeeded.\n");
        } catch (err) {
            console.error("❌ Pre-build failed:", err);
            throw err;
        }
    }

    const { dirname } = config;
    
    const { options, types, variants, output } = dfsResolvePaths(
        config,
        dirname,
    );

    // Create Esbuild Builder instance
    const Builder = new EsbuildBuilder({
...options
    });

    Builder.setLabel(config.label || "EsbuildBundle");

    // Load output formats
    Builder.loadOutputFormats(...output);

    // Load build variants
    Builder.loadBuildVariants(variants);

    if (config.postbuild) {
        Builder.loadPostBuild(async () => {
            console.log("\n🔄 Running post-build tasks...");
            try {
                await(config.postbuild as () => Promise<any>)();
            } catch (err) {
                console.error("❌ Post-build failed:", err);
                throw err;
            }
            console.log("✅ Post-build succeeded.\n");
        });
    }

    // Execute all builds
    await Builder.executeBuilds();

    if (types) {
        // Generate TypeScript declaration bundle
        await createTSCBundle({
            dirname,
            entry: types.entry,
            outDir: types.outDir,
            tsconfig: types.tsconfig,
        });
    }

    return Builder;
}
