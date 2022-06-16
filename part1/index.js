const axios = require("axios");
const { exit } = require("process");

const apiKey = "TODO";

if (apiKey === "TODO") {
  console.error("Don't forge to update the apiKey variable on line 4 with your actual API key!");
  exit(1);
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
        console.log(error.response.data.error.message);
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
        console.error(error.response);
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
	}
})()