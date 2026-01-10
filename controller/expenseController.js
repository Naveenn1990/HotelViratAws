const { uploadFile2, deleteFile } = require("../middleware/AWS");
const Expense = require("../model/Expense");

exports.createExpense = async (req, res) => {
    try {
        const { purpose, amount, date, branchId } = req.body;
        let slip = null;
        if (req.file) {
            slip = await uploadFile2(req.file, "expenses");
        } else if (req.body.slip) {
            slip = req.body.slip;
        }
        const expense = new Expense({
            purpose,
            amount,
            date: date ? new Date(date) : undefined,
            branchId,
            slip,
        });
        await expense.save();
        res.status(201).json({
            success: true,
            message: "Expense created successfully",
            data: expense
        });
    } catch (err) {
        res.status(400).json({ 
            success: false,
            message: err.message 
        });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const { period, branchId } = req.query;
        let query = {};
        if (branchId) query.branchId = Number(branchId);

        if (period) {
            const now = new Date();
            let startDate = new Date(now);
            switch (period) {
                case 'daily':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'weekly':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'monthly':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
            }
            query.date = { $gte: startDate };
        }
        const expenses = await Expense.find(query).sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) {
            return res.status(404).json({ 
                success: false,
                message: "Expense not found" 
            });
        }
        if (expense.slip) {
            await deleteFile(expense.slip); // Delete the file from storage
        }
        res.json({ 
            success: true,
            message: "Expense deleted successfully" 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};