# PathExist

Provide size of a square matrix, starting point (0 < point <= size) and the sought point (0 < point <=size)

Provide a square matrix of zeros and ones.
Each digit must be separated by space.

Example:

4 1 3 // A square matrix 4x4, start point = 1, sought point = 3.

0 1 0 1
0 0 0 0
0 0 0 0
0 0 1 0

The 1st point is connected with 2nd and 4th points.
The 2nd point is not connected with any points.
The 3rd point is not connected with any points.
The 4th point is connected with 3rd point.

Program will return true with provided data.
Path: 1->4->3
