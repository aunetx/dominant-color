from PIL import Image
import matplotlib.pyplot as plt
import sys

img = Image.open(sys.argv[1])
res = img.resize((1, 1), Image.ANTIALIAS)
print("rgb("+",".join(map(str, res.getpixel((0, 0)))), end=")")
