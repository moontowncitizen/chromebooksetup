#!/bin/bash

set -euo pipefail

# Variables
HOME_DIR="/home/$USER"
GIT_DIR="$HOME_DIR/git"
INSTALL_STUFF_REPO="$GIT_DIR/install-stuff"
DESKTOP_DIR="$HOME_DIR/Desktop"
OVERLORD_DIR="$DESKTOP_DIR/overlord"
DOWNLOADS_DIR="$HOME_DIR/Downloads"
THEMES_DIR="$HOME_DIR/.local/share/themes"
ICONS_DIR="$HOME_DIR/.local/share/icons"
BACKGROUND_IMAGE="$HOME_DIR/Pictures/gruvbox/gruvbox_random.png"
LOG_FILE="/tmp/fedora_setup_$(date +%Y%m%d_%H%M%S).log"
DOCKLIKE_RPM="$INSTALL_STUFF_REPO/rpms/xfce4-docklike-plugin-0.4.2-1.fc40.x86_64.rpm"

# Check for root privileges
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root or with sudo" 1>&2
    exit 1
fi

# Function to log messages
log_message() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install a package using DNF if not already installed
install_dnf_package() {
    local package="$1"
    if ! dnf list installed "$package" &>/dev/null; then
        log_message "Installing $package..."
        if ! dnf install "$package" -y; then
            log_message "Error installing $package"
            exit 1
        fi
    else
        log_message "$package is already installed."
    fi
}

# Function to uninstall a package using DNF
uninstall_dnf_package() {
    local package="$1"
    if dnf list installed "$package" &>/dev/null; then
        log_message "Uninstalling $package..."
        if ! dnf remove "$package" -y; then
            log_message "Error uninstalling $package"
            exit 1
        fi
    else
        log_message "$package is not installed."
    fi
}

# Function to perform uninstallation
perform_uninstall() {
    log_message "Starting uninstallation process..."
    local packages=(
        "nodejs" "kitty" "sassc" "libsass" "snapd" "qbittorrent" "libreoffice"
        "gtk-murrine-engine" "ulauncher" "cmake" "libtool" "xfce4-docklike-plugin"
    )
    for package in "${packages[@]}"; do
        uninstall_dnf_package "$package"
    done
    log_message "Uninstallation process completed."
}

# Function to set the desktop background
set_desktop_background() {
    if [[ ! -f "$BACKGROUND_IMAGE" ]]; then
        log_message "Warning: Background image not found at $BACKGROUND_IMAGE"
        return 1
    fi

    if command_exists xfconf-query; then
        xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitor0/image-path -s "$BACKGROUND_IMAGE"
    else
        log_message "Warning: xfconf-query not found. Unable to set XFCE background."
    fi
}

# Function to install MyBash
install_mybash() {
    log_message "Installing MyBash from Chris Titus Tech..."
    git clone --depth=1 https://github.com/ChrisTitusTech/mybash.git "$GIT_DIR/mybash"
    pushd "$GIT_DIR/mybash" || exit 1
    chmod +x setup.sh
    ./setup.sh
    popd || exit 1
}

# Function to install xfce dock like plugin
install_xfce_docklike_plugin() {
    if [ -f "$DOCKLIKE_RPM" ]; then
        log_message "Installing xfce4-docklike-plugin RPM..."
        if ! rpm -i "$DOCKLIKE_RPM"; then
            log_message "Error installing xfce4-docklike-plugin"
            exit 1
        fi
    else
        log_message "Warning: xfce4-docklike-plugin RPM not found at $DOCKLIKE_RPM"
    fi
}

# Start logging
log_message "Starting Fedora setup script for XFCE"

# Ensure necessary directories exist
mkdir -p "$GIT_DIR" "$THEMES_DIR" "$ICONS_DIR"

# Copy configuration files
log_message "Copying configuration files..."
cp -rv "$INSTALL_STUFF_REPO/.config" "$HOME_DIR/"
cp -rv "$INSTALL_STUFF_REPO/.fonts" "$HOME_DIR/"
cp -rv "$INSTALL_STUFF_REPO/.icons" "$HOME_DIR/"
cp -rv "$INSTALL_STUFF_REPO/.local/share/backgrounds" "$HOME_DIR/.local/share/"

# Copy XFCE-specific configurations
cp -rv "$INSTALL_STUFF_REPO/.local/share/xfce4" "$HOME_DIR/.local/share/"

# Check if xfce4-panel-profile exists before copying
if [ -d "$INSTALL_STUFF_REPO/.local/share/xfce4-panel-profile" ]; then
    cp -rv "$INSTALL_STUFF_REPO/.local/share/xfce4-panel-profile" "$HOME_DIR/.local/share/"
else
    log_message "Warning: xfce4-panel-profile directory not found, skipping copy."
fi

# Install applications
log_message "Installing applications..."
apps=(
    "sassc" "libsass" "nodejs" "kitty" "snapd" "qbittorrent" "libreoffice"
    "gtk-murrine-engine" "ulauncher" "cmake" "libtool" "xfce4-docklike-plugin"
    "clapper"
)
for app in "${apps[@]}"; do
    install_dnf_package "$app"
done

# Install starship
dnf copr enable atim/starship -y
dnf install starship -y

# Install Bash Autocomplete
install_dnf_package "bash-completion"

# Install Flatpak applications
log_message "Installing Flatpak applications..."
flatpak install -y bitwarden spotify

# Set up Snap
log_message "Setting up Snap..."
systemctl start snapd.service
ln -s /var/lib/snapd/snap /snap || log_message "Warning: Failed to create symlink for Snap"
snap refresh
snap install surfshark --edge

# Install Chromebook audio setup
log_message "Setting up Chromebook Linux audio..."
git clone https://github.com/WeirdTreeThing/chromebook-linux-audio.git "$GIT_DIR/chromebook-linux-audio"
pushd "$GIT_DIR/chromebook-linux-audio" || exit 1
chmod +x setup-audio
./setup-audio
popd || exit 1
install_dnf_package "chromium"
dnf autoremove firefox -y

# Install MyBash from Chris Titus Tech
install_dnf_package "fastfetch"
install_mybash

# Install CLI Pride Flags
log_message "Installing CLI Pride Flags..."
npm i -g cli-pride-flags

# Set desktop background
set_desktop_background

# Install Pulsar
log_message "Installing Pulsar..."
pushd "$INSTALL_STUFF_REPO/rpms" || exit 1
curl -L -o pulsar.rpm "https://download.pulsar-edit.dev/?os=linux&type=linux_rpm"
if ! rpm -i pulsar.rpm; then
    log_message "Error installing Pulsar"
    exit 1
fi
popd || exit 1

# Install icons
log_message "Installing Gruvbox Plus icons..."
pushd "$GIT_DIR/install-stuff" || exit 1
curl -L -o gruvbox-plus-icons.zip https://github.com/SylEleuth/gruvbox-plus-icon-pack/releases/download/v5.5.0/gruvbox-plus-icon-pack-5.5.0.zip
unzip -o gruvbox-plus-icons.zip -d "$HOME_DIR/.local/share/icons/"
unzip -o gruvbox-plus-icons.zip -d "$HOME_DIR/.icons/"
popd || exit 1

# Install xfce dock like plugin if applicable
install_xfce_docklike_plugin

# Install GTK themes
log_message "Installing GTK themes..."
cd "$GIT_DIR"
git clone https://github.com/Fausto-Korpsvart/Gruvbox-GTK-Theme.git
cd Gruvbox-GTK-Theme/themes
./install.sh --tweaks outline float -t green -l -c dark
cd

# Flatpak overrides for themes and icons
sudo flatpak override --filesystem="$HOME/.themes"
sudo flatpak override --filesystem="$HOME/.icons"
flatpak override --user --filesystem=xdg-config/gtk-4.0
sudo flatpak override --filesystem=xdg-config/gtk-4.0

# Completion Notification
log_message "All done, $(whoami)! Your Fedora Linux setup for XFCE is complete. Yippee!"
log_message "Setup completed. Log file: $LOG_FILE"
