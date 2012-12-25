import os
import sys
# Haaaack
sys.path.append("/home/justin/src/js-beautify/python/")
import jsbeautifier as js
import fnmatch

matches = []
for root, dirnames, filenames in os.walk('game'):
    for filename in fnmatch.filter(filenames, '*.js'):
        matches.append(os.path.join(root, filename))

for name in matches:
    contents = open(name).read()
    f = open(name, 'w')
    f.write(js.beautify(contents))
    f.close()
    