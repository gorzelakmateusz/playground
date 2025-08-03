#include "mainwindow.h"
#include "ui_mainwindow.h"

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    operations = NoOperation;
    ui->setupUi(this);
    left = 0;
    right = 0;
    memory = 0;
    isLeftEmpty = true;
    isDecimalMark = false;
    isClear = false;
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::on_PB1_clicked()
{
    AddToScreen("1");
}

void MainWindow::on_PB2_clicked()
{
    AddToScreen("2");
}

void MainWindow::on_PB3_clicked()
{
    AddToScreen("3");
}

void MainWindow::on_PB4_clicked()
{
    AddToScreen("4");
}

void MainWindow::on_PB5_clicked()
{
    AddToScreen("5");
}

void MainWindow::on_PB6_clicked()
{
    AddToScreen("6");
}

void MainWindow::on_PB7_clicked()
{
    AddToScreen("7");
}

void MainWindow::on_PB8_clicked()
{
    AddToScreen("8");
}

void MainWindow::on_PB9_clicked()
{
    AddToScreen("9");
}

void MainWindow::on_PB0_clicked()
{
      AddToScreen("0");
}

void MainWindow::on_PB_DecimalMark_clicked()
{
    if(isDecimalMark == true) return;

    ui->CalcScreen->setText(ui->CalcScreen->text().append("."));
    isDecimalMark = true;
}

void MainWindow::on_PB_C_clicked()
{
    left = 0;
    right = 0;
    memory = 0;
    isDecimalMark = false;
    isClear = false;
    operations = NoOperation;
    ui->CalcScreen->setText("0");
}

void MainWindow::on_PC_RM_clicked()
{
    ui->CalcScreen->setText(QString::number(memory));
}

void MainWindow::on_PB_Mplus_clicked()
{
    memory = ui->CalcScreen->text().toDouble();
    isClear = true;
}

void MainWindow::on_PB_equals_clicked()
{
    if(isLeftEmpty) return;
    right = ui->CalcScreen->text().toDouble();
    double tmp;
    bool set = true;

    switch(operations)
    {
        case NoOperation:
            return;
        case Add:
            tmp = left + right;
            break;
        case Sub:
            tmp = left - right;
            break;
        case Divide:
            if(left == 0 && right == 0)
            {
                ui->CalcScreen->setText("Error");
                set = false;
            }
            else if(right == 0)
            {
                ui->CalcScreen->setText("Infinity");
                set = false;
            }
            else
                tmp = left / right;
            break;
        case Multiply:
            tmp = left * right;
            break;
    }

    isLeftEmpty = true;
    isClear = true;
    if(set)
    ui->CalcScreen->setText(QString::number(tmp));
}

void MainWindow::on_PB_plus_clicked()
{
    if (isLeftEmpty == true)
    {
        OperationsFunction();
        operations = Add;
    }
}

void MainWindow::on_PB_minus_clicked()
{
    if (isLeftEmpty == true)
    {
        OperationsFunction();
        operations = Sub;
    }
}

void MainWindow::on_PB_multiply_clicked()
{
    if (isLeftEmpty == true)
    {
        OperationsFunction();
        operations = Multiply;
    }
}

void MainWindow::on_PB_divide_clicked()
{
    if (isLeftEmpty == true)
    {
        OperationsFunction();
        operations = Divide;
    }
}

void MainWindow::AddToScreen(QString text)
{
    if(isClear)
    {
        ui->CalcScreen->setText("0");
        isClear = false;
    }

    QString oldText = ui->CalcScreen->text();

    if(oldText.length() == ui->CalcScreen->maxLength()) return;
    if(oldText == "0") oldText.clear();

    oldText.append(text);
    ui->CalcScreen->setText(oldText);
}

void MainWindow::OperationsFunction()
{
    left = ui->CalcScreen->text().toDouble();
    isLeftEmpty = false;
    isDecimalMark = false;
    ui->CalcScreen->setText("0");
}
