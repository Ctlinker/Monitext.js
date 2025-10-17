export function writeErrMsg(label: string, ...msgChunk: string[]) {
	return `[@monitext/color][${label}]: ${msgChunk.join('')}`;
}

interface WarningParm {
	label: string;
	error: Error;
	throw?: boolean;
	nostack?: boolean;
}

export function warnErr(p: WarningParm) {
	let msg = writeErrMsg(
		p.label,
		p.error.name,
		' ',
		p.error.message,
		typeof p.error?.cause == 'string' ? '\ncause: ' + p.error.cause : '',
		p?.nostack ? '' : JSON.stringify(p.error.stack, null, 2),
	);

	if (p?.throw === true) {
		throw msg;
	} else {
		console.warn(msg);
	}
}
