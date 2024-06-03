// Log error in browser console
export const logError = (error: any): void => {
	if (error.response) {
		console.log(`From auth, HTTP error ${error.response.status}: ${error.response.statusText}`);
	} else if (error.request) {
		console.log('From auth, Error making request, no response received.');
	} else {
		console.log(`From auth, Error occured: ${error.message}`);
	}
};
