var data_config = [
    {
        name: "synthetic",
        path: "data/synthetic-4-1-1.csv",
        attr: {
            all: ["v","w","x","y","z","class"],
            use: [0, 1, 2, 3, 4]
        },
        category: {
            name: "class",
            index: 5,
            values: ["A", "B", "C", "D"]
        },
        animate: {
            isAnimate: true,
            initDraw: true
        }
    },
    {
        name: "diamonds",
        path: "data/diamonds-shuffled-all.csv",
        attr: {
            all: ["","carat","cut","color","clarity","depth","table","price","x","y","z"],
      use: [1, 5, 6, 7, 8, 9, 10]
        },
        category: {
            name: "cut",
      index: 2,
      values: ["Fair", "Good", "Very Good", "Premium", "Ideal"]
        },
        animate: {
            isAnimate: true,
            initDraw: false,
            animateNum: 10
        }
    },
    {
        name: "wine",
        path: "data/wine-jittered-all.csv",
        attr: {
            all: [
                '',
                'Class',                          // 1
                'Alcohol',                        // 2
                'Malic acid',                     // 3
                'Ash',                            // 4
                'Alcalinity of ash',              // 5
                'Magnesium',                      // 6
                'Total phenols',                  // 7
                'Flavanoids',                     // 8
                'Nonflavanoid phenols',           // 9
                'Proanthocyanins',                // 10
                'Color intensity',                // 11
                'Hue',                            // 12
                'OD280/OD315 of diluted wines',   // 13
                'Proline'                         // 14
            ],
          use: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
      },
        category: {
            name: "Class",
            index: 1,
            values: ['1', '2', '3']
        },
        animate: {
          isAnimate: true,
          initDraw: true
        }
    },
    {
        name: "abalone",
        path: "data/abalone-shuffled-all.csv",
        attr: {
            all: [
                "",
                "Sex",
                "Length",
                "Diameter",
                "Height",
                "Whole weight",
                "Shucked weight",
                "Viscera weight",
                "Shell weight",
                "Rings"
            ],
            use: [2, 3, 4, 5, 6, 7, 8, 9]
        },
        category: {
            name: "Sex",
            index: 1,
            values: ["M", "F", "I"]
        },
        animate: {
            isAnimate: true,
            initDraw: false
        }
    },
    {
        name: "iris",
        path: "data/iris.csv",
        attr: {
            all: ["sepal length", "sepal width", "petal length", "petal width", "class"],
            use: [0, 1, 2, 3]
        },
        category: {
            name: "class",
            index: 4,
            values: ["Iris-setosa", "Iris-versicolor", "Iris-virginica"]
        },
        animate: {
            isAnimate: true,
            initDraw: true
        }
    }
];

function get_data_config() {
    var dataset_name = document.getElementById("data-select").value;
    var config = data_config.filter(function(data){
        return data.name === dataset_name;
    })[0];
    return config;
}
