// // ✅ Example usage:
// const structure: Node[] = [
//     { type: "text", content: "Hello " },
//     {
//         type: "styled",
//         style: "red",
//         children: [
//             { type: "text", content: "world" }
//         ]
//     },
//     { type: "text", content: "!" }
// ];

// const { text, styles } = renderConsole(structure);
// console.log(text, ...styles);

// // ✅ Example usage:
// const structure: Node[] = [
//     { type: "text", content: "Hello " },
//     {
//         type: "styled",
//         style: "blue",
//         children: [
//             { type: "text", content: "world" },
//             {
//                 type: "styled",
//                 style: "red",
//                 children: [
//                     { type: "text", content: "world" },
//                 ],
//             },
//         ],
//     },
//     { type: "text", content: "!" },
// ];

// console.log(render(structure));
