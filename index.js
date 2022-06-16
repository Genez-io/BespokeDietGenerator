const axios = require("axios");
const { exit } = require("process");
const readline = require('readline');

const apiKey = "TODO";

if (apiKey === "TODO") {
  console.error("Don't forge to update the apiKey variable on line 5 with your actual API key!");
  exit(1);
}

/**
 * Handle axios error.
 * 
 * @param The error that occured.
 */
function handleError(error) {
  // If the API contains an error object, we display it,
  // otherwise we display the general axios response.
  if (error.response.data.error) {
    console.error(error.response.data.error.message);
  } else {
    console.error("An unknown error occured", error.response);
  }

  exit(1)
}

/**
 * Asks the user for some input
 * 
 * @param {*} The question displayed to the user. 
 * @returns The answer that the user provided.
 */
function askQuestion(query) {
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
      rl.close();
      resolve(ans);
  }))
}

(async () => {
  // Get the arguments array. The first two values are skipped
  // since they are not arguments.
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Wrong arguments!");
    return;
  }

  const command = args[0];

  // Handle the helloworld command.
  if (command === "helloworld") {
    console.log("helloworld")
  
  // Handle the create user command.
  } else if (command === "createUser") {
    const [height, weight, dateOfBirth, sex, activityLevel] = args.slice(1)
    const options = {
      method: 'POST',
      url: 'https://bespoke-diet-generator.p.rapidapi.com/user',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'bespoke-diet-generator.p.rapidapi.com'
      },
      data: JSON.stringify({
        "height": parseInt(height),
        "weight": parseInt(weight),
        "dateOfBirth": dateOfBirth,
        "sex": sex,
        "activityLevel": activityLevel
      })
    };
  
    const response = await axios.request(options)
      .catch((error) => handleError(error));

    console.log("User created Successfully! User ID is:", response.data.id);

    // Handle the generateDiet command.
  } else if (command === "generateDiet") {
    const [userId, dietType, weightGoal, dietDuration] = args.slice(1)
		const options = {
			method: 'PUT',
			url: 'https://bespoke-diet-generator.p.rapidapi.com/user/'+ userId +'/diet',
			headers: {
				'content-type': 'application/json',
				'X-RapidAPI-Key': apiKey,
				'X-RapidAPI-Host': 'bespoke-diet-generator.p.rapidapi.com'
			},
			data: JSON.stringify({
				"dietType": dietType,
				"weightGoal": weightGoal,
				"dietDuration": dietDuration
				}),
		};

		const response = await axios.request(options)
      .catch((error) => handleError(error));

    // Parse the response and display the new diet.
    const dailyPlan = response.data.dailyPlan;
    dailyPlan.forEach((plan, index) => {
      console.log(`Day ${index + 1}:`)
      for (const meal of plan.meals) {
        console.log(`   For meal ${meal.type} you should eat:`);
        for (const ingredient of meal.ingredients) {
          console.log(`   ${ingredient.quantity} grams of ${ingredient.name} with id ${ingredient.id}`);
        }
        console.log("");
      }
    });

    // Handle the getIngredients command.
	} else if (command === "getIngredients") {
    const options = {
      method: 'GET',
      url: 'https://bespoke-diet-generator.p.rapidapi.com/ingredients',
      headers: {
        'accept-language': 'en',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'bespoke-diet-generator.p.rapidapi.com'
      }
    };
    
    axios.request(options).then(function (response) {
      response.data.forEach((foodCategory) => {
        console.log(`${foodCategory.name}:`);
        foodCategory.ingredients.forEach((ingredient) => {
          console.log(` [${ingredient.id}]: ${ingredient.name}`);
        });
      });
      
    }).catch((error) => handleError(error));

    // Handle the setExcludedIngredients command
  } else if (command === "setExcludedIngredients") {
    // First make the request to set the excluded ingredients.
    const userId = args[1];
    const ingredients = args.slice(2)
    const optionsPut = {
      method: 'PUT',
      url: `https://bespoke-diet-generator.p.rapidapi.com/user/${userId}/ingredients/excluded`,
      headers: {
        'content-type': 'application/json',
        'accept-language': 'en',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'bespoke-diet-generator.p.rapidapi.com'
      },
      data: JSON.stringify({
        ingredientIds: ingredients
      }),
    };
    
    await axios.request(optionsPut).catch((error) => handleError(error));

    // Then make the request to get the excluded ingredients.
    const optionsGet = {
      method: 'GET',
      url: `https://bespoke-diet-generator.p.rapidapi.com/user/${userId}/ingredients/excluded`,
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'bespoke-diet-generator.p.rapidapi.com'
      }
    };
    
    axios.request(optionsGet).then(function (response) {
      console.log("The excluded ingredients are:");
      response.data.forEach((ingredient) => {
        console.log(` [${ingredient.id}]: ${ingredient.name}`);
      })
    }).catch((error) => handleError(error));

    // Handle the replaceIngredient command.
  } else if (command === "replaceIngredient") {
    const [userId, dayIndex, mealType, ingredientId] = args.slice(1)

    // Firstly, make the request to get the ingredients that can replace the specified ingredient.
    const optionsGet = {
      method: 'GET',
      url: `https://bespoke-diet-generator.p.rapidapi.com/user/${userId}/diet/${dayIndex}/${mealType}/${ingredientId}/replace`,
      headers: {
        'accept-language': 'en',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'bespoke-diet-generator.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(optionsGet)
      .catch((error) => handleError(error));

    // The user has to choose an ingredient from the list.
    console.log("Choose an ingredient from the following list:")
    response.data.forEach((ingredient) => {
      console.log(` [${ingredient.id}] ${ingredient.name} ${ingredient.grams} grams`);
    });

    const ans = await askQuestion("Write the ID of one of the ingredients above:");

    // Once the user has chosen the ingredient, we can make the request to replace the ingredient.
    const optionsPut = {
      method: 'PUT',
      url: `https://bespoke-diet-generator.p.rapidapi.com/user/${userId}/diet/${dayIndex}/${mealType}/${ingredientId}/replace`,
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'bespoke-diet-generator.p.rapidapi.com'
      },
      data: `{"ingredientId":"${ans}"}`
    };

    axios.request(optionsPut).then(function (response) {
      console.log("Ingredient replaced successfully!");
    }).catch((error) => handleError(error));
  }
})()