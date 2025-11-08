import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'Monitext.docs',
	description: "This Holds the many docs, of monitext.js it's sub libraries",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Examples', link: '/markdown-examples' },
		],

		sidebar: [
			{
				text: 'Examples',
				items: [
					{
						text: 'Libraries',
						items: [
							{
								text: 'nprint',
                collapsed: true,
								items: [{ text: 'Introduction', link: '/libs/nprint/' }],
							},
              						{
								text: 'ndata',
                collapsed: true,
								items: [{ text: 'Introduction', link: '/libs/ndata/' }],
							},
						],
						collapsed: true,
					},
				],
			},
		],

    search: {
      provider: "local"
    },

		socialLinks: [
			{ icon: 'github', link: 'https://github.com/ctlinker/monitext.js' },
		],
	},
});
