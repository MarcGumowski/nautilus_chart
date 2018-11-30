# create_data
# author : Marc Gumowski
# ver : 0.01

import os
import re
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import euclidean_distances

# env
os.chdir('C:/Users/Gumistar/Documents/GitHub/nautilus_chart') # if needed

# data
data = pd.read_table('data/usca312_xy.txt', skiprows = 7, index_col = False, sep = ' ')
data_names = pd.read_table('data/usca312_name.txt', skiprows = 15, index_col = False)

# clean name
data_names.city = [re.sub("'", "", name) for name in data_names.city]
# dist
distance = euclidean_distances(data, data)

# output to js var
def mat_to_js(mat, index_name = None, js_var_name = 'data'):
    if index_name is None:
        index_name = range(mat.shape[0])
    main_index = ["'" + str(main_index) + "':[" for main_index in index_name]
    array = []
    for i in range(mat.shape[0]):
        array_index = index_name[np.arange(len(index_name)) != i]
        array_value = mat[i][np.arange(len(index_name)) != i]
        array_list = ["{index: '" + index + "', value: " + str(value) + "}" for index, value in zip(array_index, array_value)]
        array.append(main_index[i] + ", ".join(array_list) + "]")
    js_data = "var " + js_var_name + " = {" + ", ".join(array) + "};"
    return js_data

to_js = mat_to_js(distance, index_name = data_names.city, js_var_name = 'distance')
file = open('data/data.js', 'w')
file.write(to_js)
file.close()