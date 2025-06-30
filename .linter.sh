#!/bin/bash
cd /home/kavia/workspace/code-generation/persistenttictactoe-95524-d7f701e6/tic_tac_toe_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

