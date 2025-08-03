#include <ctime>
#include <iostream>
#include <fstream>

#define RANGE 10000
#define FILE_PATH "C:\\Users\\Piranessi\\Desktop\\c++\\ProgramyQt\\Struktury_lab1\\inlab01.txt"
#define SIZE_OF_INPUT 7

struct StructForLab
{
    float f;
    int i;
    char c;
};

template <class type>
static void SetArrayZeros(type * const cpArrayP, const uint16_t cu16SizeP);

static void BubblSort(StructForLab ** const cpArrayP, const uint16_t cu16SizeP);

static bool FindNotUsedInt(bool * const cpArrayP, int * const cpiResultP );

static void ReleaseMemory(StructForLab ** const cpArrayP, const uint16_t cu16SizeP);

static uint16_t CountChars(StructForLab ** const cpArrayP, const uint16_t cu16SizeP, const char cpCharP );

static void ReadInputs(uint16_t * const cpArgAmountP, char * const cpCharP);

static StructForLab **RandomLab(const uint16_t cu16SizeP);


int main(void)
{
    srand( time ( NULL) );
    clock_t begin = 0, end = 0;
    double timeElapsed = 0;
    uint16_t SIZE = 0, charCount = 0;
    uint8_t howManyShow = 0;
    char CHAR = 0;

    ReadInputs(&SIZE, &CHAR);

    begin = clock();

    StructForLab ** structForTask = RandomLab(SIZE);
    BubblSort(structForTask, SIZE);
    charCount = CountChars(structForTask, SIZE, CHAR );

    howManyShow = 20 > SIZE ? SIZE : 20;
    for (uint8_t i = 0 ; i < howManyShow ; ++i)
    {
        std::cout << "Struct " << i+1 << std::endl
                  << "field i - " << structForTask[i]->i << std::endl
                  << "field f - " << structForTask[i]->f << std::endl
                  << "field c - " << structForTask[i]->c << std::endl << std::endl;
    }

    ReleaseMemory(structForTask, SIZE);

    end = clock();
    timeElapsed = (static_cast<double>(end-begin)/CLOCKS_PER_SEC);

    std::cout << std::endl << "Char " << CHAR << " occured " << charCount << " times"
              << std::endl << "Program execution time: " << timeElapsed << "s" << std::endl;

    return 0;
}

//!-----------------------
//! Functions definitions
//!-----------------------

template <class type>
static void SetArrayZeros(type * const cpArrayP, const uint16_t cu16SizeP)
{
    for (int i = 0; i < cu16SizeP ; ++i)
    {   cpArrayP[i] = static_cast<type>(0);  }
}

static bool FindNotUsedInt(bool * const cpArrayP, int * const cpiResultP )
{
    bool isFoundL = false;

    while (false == isFoundL)
    {
        *cpiResultP = (int)((std::rand() % 10001) - 1000);
        if (0 == cpArrayP[*cpiResultP+1000])
        {
            isFoundL = true;
            cpArrayP[*cpiResultP+1000] = 1;
        }
        else
        {
            ///do nothing
        }
    }

    return isFoundL;
}

StructForLab ** RandomLab(const uint16_t cu16SizeP)
{
    StructForLab ** sResult = new StructForLab *[cu16SizeP];
    int iTmpL;

    bool * pUsedIntegersBoolArrayL = new bool[RANGE];
    SetArrayZeros(pUsedIntegersBoolArrayL, RANGE);

    for(uint16_t i = 0 ; i < cu16SizeP ; ++i)
    {
        sResult[i] = new StructForLab;

        if (false == FindNotUsedInt(pUsedIntegersBoolArrayL, &iTmpL))
        {
            throw new std::invalid_argument("Error while getting correct int.");
        }
        else{ /*do nothing*/ }

        sResult[i]->i = iTmpL;/* -1000, 9000 */
        sResult[i]->f = static_cast<float>(1001 + i);
        sResult[i]->c = static_cast<char>(rand() % 23 + 66);/*B-X*/
    }

    return sResult;
}

static void ReleaseMemory(StructForLab ** const cpArrayP, const uint16_t cu16SizeP)
{
    for (uint16_t i = 0 ; i < cu16SizeP ; ++i) { delete [] cpArrayP[i]; }
    delete [] cpArrayP;
}

static uint16_t CountChars(StructForLab ** const cpArrayP, const uint16_t cu16SizeP, const char cpCharP )
{
    uint16_t resultL = 0;

    for (uint16_t i = 0 ; i < cu16SizeP ; ++i)
    {
        if (cpCharP == cpArrayP[i]->c)
        {
            ++resultL;
        }
        else
        {
            ///do nothing
        }
    }

    return resultL;
}

static void ReadInputs(uint16_t * const cpArgAmountP, char * const cpCharP)
{
    std::fstream fileL;
    char dataL[SIZE_OF_INPUT];
    char tmpL[SIZE_OF_INPUT-2];

    (void)fileL.open(FILE_PATH, std::ios::in);

    if (false == fileL.good())
    {
        std::cerr << "Error while opening file - function ReadInputs";
    }
    else
    {
        fileL.getline(dataL, SIZE_OF_INPUT);
    }

    //! Assumption that input data is valid.
    for (uint8_t i = 0; i < (SIZE_OF_INPUT) ; ++i )
    {
        if (dataL[i] >= 48 && dataL[i] <= 57)
        {
            tmpL[i] = dataL[i];
        }
        else
        {
            *cpArgAmountP = atoi(tmpL);
            *cpCharP = dataL[i+1];
            i = SIZE_OF_INPUT;
        }
    }

    fileL.close();
}

static void BubblSort(StructForLab ** const cpArrayP, const uint16_t cu16SizeP)
{
    bool shouldBreak = true;
    StructForLab * cpTmpL;
    std::cout << "test";

    for (uint16_t it1 = 1; it1 < cu16SizeP; ++it1)
    {
        shouldBreak = true;
        for (uint16_t it2 = 0; it2 < (cu16SizeP-it1); ++it2)
        {
            if (cpArrayP[it2]->i > cpArrayP[it2 + 1]->i)
            {
                cpTmpL = cpArrayP[it2 + 1];
                cpArrayP[it2 + 1] = cpArrayP[it2];
                cpArrayP[it2] = cpTmpL;
                shouldBreak = false;
            }
        }
        if (true == shouldBreak) break;
    }
}
