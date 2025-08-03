#ifndef GAMESCENE_H
#define GAMESCENE_H

#include <QGraphicsRectItem>
#include <QGraphicsEllipseItem>
#include <QGraphicsView>
#include <QGraphicsSceneMouseEvent>
#include <QDebug>
#include <QGraphicsItem>
#include <vector>
#include <QList>
#include <QLabel>
#include <pawn.h>
//#include <whiteplayer.h>

class GameScene : public QGraphicsScene
{
    QBrush whiteBrush, blackBrush, grayBrush, whiteKingBrush, blackKingBrush;
    QPen outlinePen4Chessboard, outlinePen4Pawn, outlinePen4SelectedPawn;
    QGraphicsEllipseItem * currentlySelectedPawn;
    bool whitePlayerMove, isPawnSelected, isDuringMove;
    QList<QGraphicsRectItem *> whiteFieldsList, blackFieldsList;
    QList<Pawn *> whitePawnsList, blackPawnsList;
    QLabel * moveInfo;

    Pawn * PawnMaker(int x, int y, QGraphicsScene * scene, QPen pen, QBrush brush);
    QGraphicsRectItem * FieldMaker(int x, int y, QGraphicsScene * scene, QPen pen, QBrush brush );
    bool PosChecker(QGraphicsSceneMouseEvent *event, int currentlySPX, int currentlySPY, int i);
    bool FieldChecker(int numX, int numY);
    bool PawnChecker(int numX, int numY);
    bool FieldChecker4King();
    bool CheckIfMoveAvailable(QPointF xy, int xAdd, int yAdd, QGraphicsSceneMouseEvent *event);
    void CheckIfKing ();
    void SetPawns(QGraphicsScene* scene);
    void SetChessboard(QGraphicsScene* scene);
    void ResetPawn();
    void Moves(QGraphicsSceneMouseEvent *event, int numX, int numY);

protected:
    void mousePressEvent(QGraphicsSceneMouseEvent *event);

public:
    GameScene(QLabel *moveInfoLabel);
    int setSizeOfSquare();
};

#endif // GAMESCENE_H
