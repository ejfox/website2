#!/bin/bash
# website2 4-pane layout: editor + dev server + claude + lazygit

# Split bottom 30% for bottom row
tmux split-window -v -p 30

# Split bottom pane 50/50 vertically
tmux split-window -h -p 50
# Currently in bottom-right, start lazygit
tmux send-keys "lazygit" C-m

# Go to bottom-left, start claude
tmux select-pane -t 1
tmux send-keys "claude" C-m

# Go to top pane
tmux select-pane -t 0

# Split top pane to create middle section (25% of top pane for dev server)
tmux split-window -v -p 25
# Currently in middle, start dev server
tmux send-keys "npm run dev" C-m

# Go to top pane and open nvim
tmux select-pane -t 0
tmux send-keys "nvim" C-m
