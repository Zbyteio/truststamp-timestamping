import { ACCOUNT_LS } from '../config/constants';

// Checks local storage if auth object is stored
const checkLocalStorage = () => {
	let account: any = localStorage.getItem(ACCOUNT_LS);
	try {
		if (account) {
			account = JSON.parse(account);
			if (account.idTokenParsed) return account;
		}
	} catch (error) {
		console.log(error);
	}
	return null;
};

export { checkLocalStorage };
