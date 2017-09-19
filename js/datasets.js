var datasets = {
  'iris': {
    'path': 'data/iris.csv',
    'details': {
      'link': 'https://archive.ics.uci.edu/ml/datasets/iris',
      'note': 'The points in this dataset have been jittered slightly.'
    },
    'columns': {
      'names': ['sepal length', 'sepal width', 'petal length', 'petal width', 'class'],
      'shown': [0, 1, 2, 3]
    },
    'classes': {
      'names': ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'],
      'index': 4
    },
    'default': {
      'animate': true,
      'prerender': true,
      'shuffle': true,
      'rows': 1
    }
  },
  'synthetic': {
    'path': 'data/synthetic.csv',
    'details': {
      'link': 'http://scikit-learn.org/stable/datasets/index.html#sample-generators',
      'note': 'This is a synthetic dataset generated using scikit-learn in Python.'
    },
    'columns': {
      'names': ['v', 'w', 'x', 'y', 'z', 'class'],
      'shown': [0, 1, 2, 3, 4]
    },
    'classes': {
      'names': ['A', 'B', 'C', 'D'],
      'index': 5
    },
    'default': {
      'animate': true,
      'prerender': true,
      'rows': 1
    }
  },
  'wine': {
    'path': 'data/wine.csv',
    'details': {
      'link': 'https://archive.ics.uci.edu/ml/datasets/Wine',
      'note': 'The points in this dataset have been jittered slightly.'
    },
    'columns': {
      'names': [
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
      'shown': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    },
    'classes': {
      'names': ['1', '2', '3'],
      'index': 1
    },
    'default': {
      'animate': true,
      'prerender': true,
      'rows': 1
    }
  },
  'abalone': {
    'path': 'data/abalone.csv',
    'details': {
      'link': 'https://archive.ics.uci.edu/ml/datasets/Abalone',
      'note': 'The rows in this dataset have been randomly shuffled.'
    },
    'columns': {
      'names': [
        '',
        'Sex',
        'Length',
        'Diameter',
        'Height',
        'Whole weight',
        'Shucked weight',
        'Viscera weight',
        'Shell weight',
        'Rings'
      ],
      'shown': [2, 3, 4, 5, 6, 7, 8, 9]
    },
    'classes': {
      'names': ['M', 'F', 'I'],
      'index': 1
    },
    'default': {
      'animate': true,
      'prerender': false,
      'rows': 1
    }
  },
  'diamonds': {
    'path': 'data/diamonds.csv',
    'details': {
      'link': 'http://ggplot2.tidyverse.org/reference/diamonds.html',
      'note': 'This dataset has been reordered to place outliers first.'
    },
    'columns': {
      'names': ['', 'carat', 'cut', 'color', 'clarity', 'depth', 'table', 'price', 'x', 'y', 'z'],
      'shown': [1, 5, 6, 7, 8, 9, 10]
    },
    'classes': {
      'names': ['Fair', 'Good', 'Very Good', 'Premium', 'Ideal'],
      'index': 2
    },
    'default': {
      'animate': true,
      'prerender': false,
      'rows': 10
    }
  }
};
