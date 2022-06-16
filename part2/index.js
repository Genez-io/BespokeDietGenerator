const axios = require("axios");
const readline = require('readline');
const { exit } = require("process");

const apiKey = "TODO";

if (apiKey === "TODO") {
  console.error("Don't forge to update the apiKey variable on line 5 with your actual API key!");
  exit(1);
}

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
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Wrong arguments!");
    return;
  }

  const command = args[0];

  if (command === "helloworld") {
    console.log("helloworld")
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
      .catch((error) => {
        console.log(error.response);
        process.exit(1);
      });
    // TODO parse the response and display it nicely.
    console.log("User created Successfully! User ID is:", response.data.id);
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
      .catch(function (error) {
        console.error(error);
      });

    // Step
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
      
    }).catch(function (error) {
      console.error(error);
    });
  } else if (command === "setExcludedIngredients") {
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
    
    await axios.request(optionsPut).catch(function (error) {
      console.error(error.response.data);
    });

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
    }).catch(function (error) {
      console.error(error.response.data);
    });
  } else if (command === "replaceIngredient") {
    const [userId, dayIndex, mealType, ingredientId] = args.slice(1)

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
      .catch(function (error) {
        console.error(error.response);
      });
    console.log("Choose an ingredient from the following list:")
    response.data.forEach((ingredient) => {
      console.log(` [${ingredient.id}] ${ingredient.name} ${ingredient.grams} grams`);
    });

    const ans = await askQuestion("Write the ID of one of the ingredients above:");

    console.log(ans);
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
    }).catch(function (error) {
      console.error(error.response);
    });
  }
})()