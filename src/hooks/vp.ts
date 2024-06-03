import { useState, useEffect } from 'react';

export default function useVp() {
	const [width, setWidth] = useState(null);
	const [device, setDevice] = useState(null);

	const style = getComputedStyle(document.documentElement);

	const getDeviceByVpWidth = width => {
		const get = key => parseInt(style.getPropertyValue(key));

		for (const device of ['mobile', 'tablet', 'desktop']) {
			if (get(`--${device}-min`) <= width && width <= get(`--${device}-max`)) {
				return device;
			}
		}
	};

	const measure = () => {
		setWidth(innerWidth);
		setDevice(getDeviceByVpWidth(innerWidth));
	};

	useEffect(() => {
		const debouce = 200;
		let id;

		measure();

		const onResize = () => {
			clearTimeout(id);
			id = setTimeout(measure, debouce);
		};

		addEventListener('resize', onResize);
		return () => removeEventListener('resize', onResize);
	}, []);

	return { width, device };
}
