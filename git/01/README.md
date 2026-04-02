# Git Practice Notes

## 常见查看命令

`git status`

- 查看当前仓库状态
- 看哪些文件被修改了
- 看哪些文件已经暂存
- 看工作区是否干净

`git log --oneline --decorate`

- 查看简洁的提交历史
- 看当前 `HEAD` 和分支指向哪个提交

`git reflog`

- 查看 `HEAD` 最近去过哪些位置
- 当某些提交被 `reset` 后，仍然可以用它找回 commit hash

`git diff`

- 查看工作区里改了什么
- 适合看“改了但还没 `git add`”的内容

`git diff --cached`

- 查看已经暂存、准备提交的内容
- 适合检查 `git add` 之后到底会提交什么

`git show <commit>`

- 查看某个提交的详细内容
- 可以看这个提交改了哪些文件、哪些代码

`git branch`

- 查看本地分支
- 也能看当前所在分支

`git branch -a`

- 查看本地和远程的所有分支

## 切换与查看历史版本

`git switch main`

- 切回 `main` 分支
- 一般用来回到最新版本

`git switch --detach <commit>`

- 临时切换到某个历史提交
- 适合查看旧代码和旧页面效果
- 不会改当前分支历史
- 会进入 `detached HEAD` 状态

`git checkout <commit>`

- 老写法
- 在“查看某个历史提交”这个场景里，效果和 `git switch --detach <commit>` 类似

`git switch -`

- 切回上一个位置
- 适合从历史提交快速返回

`git switch -c <new-branch>`

- 创建并切换到一个新分支
- 适合准备开发新功能时使用

`git branch <new-branch>`

- 只创建新分支
- 不会自动切换过去

`git merge <branch>`

- 把指定分支的内容合并到当前分支
- 一般要先切到目标分支，再执行合并

## reset 的区别

`git reset --soft <commit>`

- 把当前分支回退到指定提交
- 保留工作区文件内容
- 保留暂存区改动
- 常用于撤销提交记录，但保留代码
- 页面效果通常不会变

`git reset --hard <commit>`

- 把当前分支回退到指定提交
- 工作区文件一起回退
- 暂存区也一起回退
- 未保存改动会丢失
- 页面效果会真的变成那个版本

## 常见提交命令

`git add <file>`

- 把文件加入暂存区
- 表示准备把这次修改纳入下一次提交

`git commit -m "message"`

- 创建一次新的提交
- 会把暂存区内容保存进历史

## 远程协作常用命令

`git fetch`

- 从远程获取最新提交和分支信息
- 只更新本地对远程的认识
- 不会直接改你当前工作区代码

`git pull`

- 从远程拉取最新内容并合并到当前分支
- 可以理解成常见场景下的 `fetch + merge`

`git push`

- 把本地提交推送到远程仓库

`git push -u origin <branch>`

- 第一次推送某个新分支时常用
- 会顺便建立本地分支和远程分支的跟踪关系

## 撤销与恢复

`git restore <file>`

- 撤销工作区里某个文件的修改
- 适合文件还没 `add` 的情况

`git restore --staged <file>`

- 把文件从暂存区移出来
- 适合撤销 `git add`

`git revert <commit>`

- 生成一个新的提交，用来撤销某个旧提交的效果
- 不会改写已有历史
- 更适合已经推到远程的公共分支

## 临时保存现场

`git stash`

- 临时把当前未提交改动收起来
- 适合想先切分支或拉代码，但又不想马上提交

`git stash pop`

- 恢复最近一次 stash 的内容

`git stash list`

- 查看当前有哪些 stash 记录

## 练习里最常用的场景

临时看旧版本：

```bash
git switch --detach <commit>
```

看完回到最新：

```bash
git switch main
```

撤销几个提交，但代码先保留：

```bash
git reset --soft <commit>
```

彻底退回某个旧版本：

```bash
git reset --hard <commit>
```

找回被 reset 掉的提交：

```bash
git reflog
```

## 一句话记忆

- `switch --detach`：临时看旧版本
- `checkout <commit>`：老写法，也能看旧版本
- `reset --soft`：回退历史，不回退代码
- `reset --hard`：历史和代码一起回退
- `reflog`：找回最近去过的提交
- `diff`：看改了什么
- `restore`：撤销当前修改或撤销暂存
- `revert`：用新提交撤销旧提交
- `stash`：先把未提交改动存起来
- `fetch/pull/push`：和远程同步
