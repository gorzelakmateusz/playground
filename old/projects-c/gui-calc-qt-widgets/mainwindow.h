#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

private slots:
    void on_PB1_clicked();

    void on_PB2_clicked();

    void on_PB3_clicked();

    void on_PB4_clicked();

    void on_PB5_clicked();

    void on_PB6_clicked();

    void on_PB7_clicked();

    void on_PB8_clicked();

    void on_PB9_clicked();

    void on_PB0_clicked();

    void on_PB_C_clicked();

    void on_PC_RM_clicked();

    void on_PB_Mplus_clicked();

    void on_PB_equals_clicked();

    void on_PB_plus_clicked();

    void on_PB_minus_clicked();

    void on_PB_multiply_clicked();

    void on_PB_divide_clicked();

    void on_PB_DecimalMark_clicked();

private:
    Ui::MainWindow *ui;

    enum OperationsEnum {
        Add,
        Sub,
        Divide,
        Multiply,
        NoOperation
    };

    OperationsEnum operations;

    double left;
    double right;
    double memory;
    bool isLeftEmpty;
    bool isDecimalMark;
    bool isClear;

    void AddToScreen(QString text);
    void OperationsFunction();
};

#endif // MAINWINDOW_H
