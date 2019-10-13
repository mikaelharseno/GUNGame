"""
PNGCutter.py
Copyright @ Mikael Harseno Subianto
09/29/2019
A PNG Cutter that cuts subimages from a whole png image. Made initially to work with custom-sized sprite sheet images.
Insensitive to rectangular-ly overlapping images, however does this at a cost of a small increase in runtime.

"""


import png
import sys
import math

pngFilename = sys.argv[1]
outputFolder = sys.argv[2]
outputName = sys.argv[3]

numImage = 0

readerPng = png.Reader(filename=pngFilename)

if (readerPng == None):
	print("File does not exist")
	exit()

readResults = readerPng.read()

width = readResults[0]
height = readResults[1]
readIterator = readResults[2]
info = readResults[3]

arrayRead = [row for row in readIterator]

# print(len(arrayRead[0])) #x length (width)
# print(len(arrayRead)) #y length (height)
# print(info)

def rgbanotzerocheck(x, y):
	return (arrayRead[y][x] != 0 or arrayRead[y][x+1] != 0 or arrayRead[y][x+2] != 0) and arrayRead[y][x+3] != 0

pixelNotZero = rgbanotzerocheck
numlayer = 4

def getAssociatedImage(x, y):
	currentImage = [(x,y,arrayRead[y][x],arrayRead[y][x+1],arrayRead[y][x+2],arrayRead[y][x+3])]
	toExpand = [(x,y)]
	arrayRead[y][x] = 0
	arrayRead[y][x+1] = 0
	arrayRead[y][x+2] = 0
	arrayRead[y][x+3] = 0

	while True:
		if len(toExpand) == 0:
			break
		curExpand = toExpand.pop(0)
		getAdj(curExpand[0], curExpand[1], toExpand, currentImage)

	if (len(currentImage) < 10):
		return

	outxmin = currentImage[0][0]
	outxmax = currentImage[0][0]
	outymin = currentImage[0][1]
	outymax = currentImage[0][1]

	for pixelData in currentImage:
		if pixelData[0] < outxmin:
			outxmin = pixelData[0]
		if pixelData[0] > outxmax:
			outxmax = pixelData[0]
		if pixelData[1] < outymin:
			outymin = pixelData[1]
		if pixelData[1] > outymax:
			outymax = pixelData[1]

	outwidth = math.ceil((outxmax - outxmin + 1) / 4)
	outheight = outymax - outymin + 1

	#Saves the current image in currentImage
	outimg = [[0 for i in range(0, numlayer * outwidth)] for j in range(outheight)]
	for pixelData in currentImage:
		pixelx = pixelData[0] - outxmin
		pixely = pixelData[1] - outymin
		outimg[pixely][pixelx] = pixelData[2]
		outimg[pixely][pixelx+1] = pixelData[3]
		outimg[pixely][pixelx+2] = pixelData[4]
		outimg[pixely][pixelx+3] = pixelData[5]

	global numImage
	global outputFolder
	f = open('./' + outputFolder + '/' + outputName + '_img_' + str(numImage) + '.png', 'wb')      # binary mode is important
	w = png.Writer(outwidth, outheight, greyscale=False, bitdepth=8, alpha=True)
	w.write(f, outimg)
	f.close()
	numImage = numImage + 1



def getAdj(x, y, toExpandList, currentImagePixels):
	notRightmost = x < (numlayer * width) - numlayer
	notLeftmost = x > 0 
	notTopmost = y < height - 1 
	notBottommost = y > 0

	def checkzero(xc,yc, arrayRead, toExpandList, currentImagePixels):
		if pixelNotZero(xc,yc):
			toExpandList += [(xc,yc)]
			currentImagePixels += [(xc,yc,arrayRead[yc][xc],arrayRead[yc][xc+1],arrayRead[yc][xc+2],arrayRead[yc][xc+3])]
			arrayRead[yc][xc] = 0
			arrayRead[yc][xc+1] = 0
			arrayRead[yc][xc+2] = 0
			arrayRead[yc][xc+3] = 0

	if (notRightmost):
		checkzero(x+4, y, arrayRead, toExpandList, currentImagePixels)
	if (notRightmost and notTopmost):
		checkzero(x+4, y+1, arrayRead, toExpandList, currentImagePixels)
	if (notTopmost):
		checkzero(x, y+1, arrayRead, toExpandList, currentImagePixels)
	if (notLeftmost and notTopmost):
		checkzero(x-4, y+1, arrayRead, toExpandList, currentImagePixels)
	if (notLeftmost):
		checkzero(x-4, y, arrayRead, toExpandList, currentImagePixels)
	if (notLeftmost and notBottommost):
		checkzero(x-4, y-1, arrayRead, toExpandList, currentImagePixels)
	if (notBottommost):
		checkzero(x, y-1, arrayRead, toExpandList, currentImagePixels)
	if (notBottommost and notRightmost):
		checkzero(x+4, y-1, arrayRead, toExpandList, currentImagePixels)


for y in range(height):
	for x in range(0, numlayer*width, numlayer):
		if pixelNotZero(x, y):
			getAssociatedImage(x, y)



