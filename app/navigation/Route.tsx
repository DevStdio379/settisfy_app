import React from 'react';
import { ThemeContextProvider } from '../constants/ThemeContext';
import StackNavigator from './StackNavigator';
import { UserProvider } from '../context/UserContext';


const Route = () => {

	return (
			<UserProvider>
				<ThemeContextProvider>
					<StackNavigator />
				</ThemeContextProvider>
			</UserProvider>
	)

}

export default Route;